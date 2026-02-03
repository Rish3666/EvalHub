"use client"
import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Send, Image as ImageIcon, Reply, Hash, MoreVertical, Search, User, AtSign, Smile } from 'lucide-react'

interface Message {
    id: number;
    content: string;
    user_id: string;
    created_at: string;
    reply_to_id: number | null;
    attachments: any[];
    users?: {
        github_username: string;
        avatar_url: string;
        full_name: string;
    }
}

interface Member {
    id: string;
    github_username: string;
    full_name: string;
    avatar_url: string;
}

interface Community {
    id: string;
    name: string;
    description: string;
    tags: string;
}

export default function CommunityChatPage() {
    const params = useParams()
    const router = useRouter()
    const communityId = (Array.isArray(params.id) ? params.id[0] : params.id) || ''

    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [replyTo, setReplyTo] = useState<Message | null>(null)
    const [community, setCommunity] = useState<Community | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [uploading, setUploading] = useState(false)

    // Mention state
    const [mentionSearch, setMentionSearch] = useState('')
    const [showMentions, setShowMentions] = useState(false)
    const [mentionIndex, setMentionIndex] = useState(0)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/')
                return
            }
            setCurrentUser(session.user)

            await Promise.all([
                fetchCommunityInfo(),
                fetchMessages(),
                fetchMembers()
            ])
            setLoading(false)
        }
        init()

        // Realtime subscription for instant message updates
        const channel = supabase
            .channel(`community-${communityId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `community_id=eq.${communityId}`
                },
                (payload) => {
                    // Add the new message to the list
                    setMessages((prev) => [...prev, payload.new as any])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [communityId])

    useEffect(() => {
        if (!loading) scrollToBottom()
    }, [messages.length])

    async function fetchCommunityInfo() {
        try {
            const res = await fetch(`/api/communities/${communityId}`)
            if (res.ok) {
                const data = await res.json()
                setCommunity(data)
            }
        } catch (error) {
            console.error("Failed to fetch community info", error)
        }
    }

    async function fetchMembers() {
        try {
            const res = await fetch(`/api/communities/${communityId}/members`)
            if (res.ok) {
                const data = await res.json()
                setMembers(data)
            }
        } catch (error) {
            console.error("Failed to fetch members", error)
        }
    }

    async function fetchMessages() {
        try {
            const res = await fetch(`/api/communities/${communityId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (error) {
            console.error("Failed to fetch messages", error)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file")
            return
        }

        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${communityId}/${fileName}`

            const { error: uploadError, data } = await supabase.storage
                .from('communities')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('communities')
                .getPublicUrl(filePath)

            // Auto-send message with image
            await handleSendMessage(null, [publicUrl])
            toast.success("Image uploaded")
        } catch (error: any) {
            toast.error(`Upload failed: ${error.message}`)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        const cursorPosition = e.target.selectionStart || 0
        setNewMessage(val)

        // Check for @ mention
        const textBeforeCursor = val.slice(0, cursorPosition)
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

        if (mentionMatch) {
            setMentionSearch(mentionMatch[1].toLowerCase())
            setShowMentions(true)
            setMentionIndex(0)
        } else {
            setShowMentions(false)
        }
    }

    const insertMention = (username: string) => {
        const cursorPosition = inputRef.current?.selectionStart || 0
        const textBeforeCursor = newMessage.slice(0, cursorPosition)
        const textAfterCursor = newMessage.slice(cursorPosition)

        const lastAtIndex = textBeforeCursor.lastIndexOf('@')
        const updatedText = textBeforeCursor.slice(0, lastAtIndex) + '@' + username + ' ' + textAfterCursor

        setNewMessage(updatedText)
        setShowMentions(false)
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions) {
            const filtered = members.filter(m => m.github_username.toLowerCase().includes(mentionSearch))

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(prev => (prev + 1) % filtered.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(prev => (prev - 1 + filtered.length) % filtered.length)
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                if (filtered[mentionIndex]) {
                    insertMention(filtered[mentionIndex].github_username)
                }
            } else if (e.key === 'Escape') {
                setShowMentions(false)
            }
        }
    }

    const handleSendMessage = async (e: React.FormEvent | null, attachments: string[] = []) => {
        if (e) e.preventDefault()
        if (!newMessage.trim() && attachments.length === 0) return

        const content = newMessage
        setNewMessage('')
        const prevReplyTo = replyTo
        setReplyTo(null)

        try {
            const res = await fetch(`/api/communities/${communityId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content || (attachments.length > 0 ? '' : ''),
                    reply_to_id: prevReplyTo?.id,
                    attachments: attachments
                })
            })

            if (!res.ok) {
                toast.error("Failed to send message")
                setNewMessage(content) // Restore
            } else {
                await fetchMessages()
            }
        } catch (error) {
            toast.error("Network error")
        }
    }

    const renderContent = (content: string) => {
        const parts = content.split(/(@\w+)/g)
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                const username = part.slice(1)
                const isMember = members.some(m => m.github_username.toLowerCase() === username.toLowerCase())
                return (
                    <span
                        key={i}
                        className={`${isMember ? 'bg-white/20 text-white' : 'text-blue-400'} font-bold px-1 rounded cursor-pointer hover:underline`}
                        onClick={() => router.push(`/project/${username}/analysis`)}
                    >
                        {part}
                    </span>
                )
            }
            return part
        })
    }

    const filteredMentionMembers = members.filter(m =>
        m.github_username.toLowerCase().includes(mentionSearch) ||
        m.full_name?.toLowerCase().includes(mentionSearch)
    )

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1200px] mx-auto pt-4 relative bg-black font-mono">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white px-6 py-4 bg-black z-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-white flex items-center justify-center font-bold text-2xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                        <Hash className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-bold tracking-[0.2em] uppercase">
                            {community?.name || `COMMUNITY_${communityId.slice(0, 8)}`}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Online_
                            </span>
                            <span className="text-[10px] text-gray-500 tracking-widest border-l border-white/20 pl-3">
                                {members.length} Members
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center border border-white/20 px-4 py-2 bg-white/5 group focus-within:border-white transition-colors">
                        <Search className="w-4 h-4 text-gray-500 mr-3 group-focus-within:text-white" />
                        <input
                            type="text"
                            placeholder="SEARCH_LOGS..."
                            className="bg-transparent border-none text-xs text-white placeholder-gray-700 focus:outline-none w-48 font-mono tracking-widest uppercase"
                        />
                    </div>
                    <button className="p-2 border border-white/10 hover:border-white text-gray-400 hover:text-white transition-all">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-white font-mono gap-6 animate-pulse">
                        <div className="w-12 h-12 border-4 border-t-white border-white/10 rounded-full animate-spin"></div>
                        <p className="tracking-[0.5em] text-sm font-bold">DECRYPTING_COMMUNICATION_STREAM...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full border border-dashed border-white/10 m-4 opacity-50">
                        <Smile className="w-12 h-12 mb-4 text-gray-500" />
                        <p className="font-bold tracking-widest uppercase text-sm">Empty_Node</p>
                        <p className="text-xs mt-2 text-gray-600">Be the first to transmit a signal.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user_id === currentUser?.id;
                        const prevMsg = messages[index - 1];
                        const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 60000 * 5);

                        return (
                            <div key={msg.id} className={`group flex flex-col ${showHeader ? 'mt-8' : 'mt-1'} px-4`}>
                                <div className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start group-hover:bg-white/5 transition-all py-2 rounded-lg relative`}>
                                    {/* Avatar */}
                                    <div className="w-10 h-10 flex-shrink-0">
                                        {showHeader ? (
                                            <div className={`w-10 h-10 border ${isMe ? 'border-blue-500' : 'border-white'} overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]`}>
                                                {msg.users?.avatar_url ? (
                                                    <img src={msg.users.avatar_url} alt={msg.users.github_username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white text-black font-bold text-xs">
                                                        {msg.users?.github_username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Message Content */}
                                    <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        {showHeader && (
                                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${isMe ? 'text-blue-400' : 'text-white'}`}>
                                                    {isMe ? 'YOU' : (msg.users?.github_username || 'UNKNOWN')}
                                                </span>
                                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        )}

                                        {/* Reply Context */}
                                        {msg.reply_to_id && (
                                            <div
                                                className={`mb-2 p-2 border-l-2 border-blue-500/30 bg-white/5 text-[10px] text-gray-500 max-w-sm cursor-pointer hover:bg-white/10 transition-colors ${isMe ? 'text-right border-r-2 border-l-0' : 'text-left'}`}
                                                onClick={() => {
                                                    const parent = document.getElementById(`msg-${msg.reply_to_id}`);
                                                    parent?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }}
                                            >
                                                <div className="flex items-center gap-2 mb-1 opacity-70">
                                                    <Reply className="w-3 h-3" />
                                                    <span className="font-bold">REPLY_TO</span>
                                                </div>
                                                <p className="truncate line-clamp-1 italic">
                                                    {messages.find(m => m.id === msg.reply_to_id)?.content || 'Original transmission lost...'}
                                                </p>
                                            </div>
                                        )}

                                        <div id={`msg-${msg.id}`} className={`relative group/bubble p-3 rounded-md ${isMe
                                            ? 'bg-blue-900/20 border border-blue-500/30 text-right selection:bg-blue-500'
                                            : 'bg-white/5 border border-white/10 text-left selection:bg-white'
                                            }`}>
                                            {msg.content && (
                                                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {renderContent(msg.content)}
                                                </div>
                                            )}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className={`flex flex-wrap gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    {msg.attachments.map((url, i) => (
                                                        <div key={i} className="max-w-[200px] border border-white/20 bg-black p-0.5 hover:border-white transition-colors cursor-zoom-in">
                                                            <img
                                                                src={url}
                                                                alt="Attachment"
                                                                className="w-full object-contain"
                                                                onClick={() => window.open(url, '_blank')}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Hover Action */}
                                            <div className={`absolute top-0 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover/bubble:opacity-100 transition-opacity`}>
                                                <button
                                                    onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                    className="p-1.5 bg-black border border-white/20 hover:border-white text-gray-500 hover:text-white transition-colors"
                                                    title="Reply"
                                                >
                                                    <Reply className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Mention List Dropdown */}
            {showMentions && filteredMentionMembers.length > 0 && (
                <div className="absolute left-6 bottom-32 w-72 bg-black border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                    <div className="bg-black border-b border-white text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex justify-between items-center">
                        <span>Mention_Person</span>
                        <AtSign className="w-3 h-3" />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filteredMentionMembers.map((member, i) => (
                            <div
                                key={member.id || i}
                                className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${i === mentionIndex ? 'bg-white text-black' : 'hover:bg-white/10 text-white'}`}
                                onClick={() => insertMention(member.github_username)}
                                onMouseEnter={() => setMentionIndex(i)}
                            >
                                <div className={`w-8 h-8 border ${i === mentionIndex ? 'border-black' : 'border-white/20'} overflow-hidden`}>
                                    <img src={member.avatar_url} alt={member.github_username} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold truncate">@{member.github_username}</span>
                                    <span className={`text-[10px] truncate ${i === mentionIndex ? 'text-black/60' : 'text-gray-500'}`}>
                                        {member.full_name || 'Active Member'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-6 bg-black border-t border-white pb-10">
                {replyTo && (
                    <div className="flex items-center justify-between bg-white text-black px-4 py-2 mb-4 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-left-4">
                        <div className="flex items-center gap-2">
                            <Reply className="w-3 h-3" />
                            <span>Replying to @{messages.find(m => m.id === replyTo.id)?.users?.github_username || 'NODE'}</span>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="hover:opacity-50 transition-opacity">CLOSE [X]</button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="relative group">
                    <div className="flex items-end gap-3 bg-white/5 border-2 border-white/20 p-4 focus-within:border-white focus-within:bg-black transition-all">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`p-2 border border-white/10 text-gray-500 hover:text-white hover:border-white transition-all ${uploading ? 'animate-pulse' : ''}`}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={uploading ? 'UPLOADING_DATA...' : replyTo ? 'Transmission_Linked...' : 'BROADCAST_SIGNAL...'}
                                className="w-full bg-transparent border-none text-white focus:outline-none py-2 px-1 font-mono text-sm placeholder:text-gray-800 tracking-widest uppercase"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !uploading) || uploading}
                            className="bg-white text-black p-3 hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> MARKDOWN_READY</span>
                            <span className="flex items-center gap-1"><AtSign className="w-3 h-3" /> MENTIONS_ON</span>
                        </div>
                        <div className="flex gap-4">
                            <span>CTRL + ENTER TO SEND</span>
                            <span className="text-white/30">|</span>
                            <span>V.1.0_PROTOTYPE</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
