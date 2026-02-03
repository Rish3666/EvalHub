'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Send, Image as ImageIcon, Reply, Hash, MoreVertical, Search, User } from 'lucide-react'

interface Message {
    id: number;
    content: string;
    user_id: string;
    created_at: string;
    reply_to_id: number | null;
    attachments: any[];
    // Mock user details for now as we don't have a robust profile join yet
    username?: string;
    avatar_url?: string;
}

export default function CommunityChatPage() {
    const params = useParams()
    const router = useRouter()
    const communityId = (Array.isArray(params.id) ? params.id[0] : params.id) || ''
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [replyTo, setReplyTo] = useState<Message | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Mock User Cache (In a real app, we'd fetch profiles)
    const [userCache, setUserCache] = useState<Record<string, { username: string, avatar: string }>>({})

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

            // Initial Fetch
            await fetchMessages()
            setLoading(false)
        }
        init()

        // Polling for new messages every 3s
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [communityId])

    useEffect(() => {
        scrollToBottom()
    }, [messages.length])

    async function fetchMessages() {
        try {
            const res = await fetch(`/api/communities/${communityId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)

                // Fetch profiles for unknowns (Mocking this part for speed/stability as per request)
                // In a real implementation, we would collect user_ids and fetch from a 'profiles' table.
                // For now, we will fallback to "User_{slice(id)}" if cache miss.
            }
        } catch (error) {
            console.error("Failed to fetch messages", error)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        // Optimistic Update
        const tempId = Date.now()
        const optimisticMsg: Message = {
            id: tempId,
            content: newMessage,
            user_id: currentUser?.id,
            created_at: new Date().toISOString(),
            reply_to_id: replyTo?.id || null,
            attachments: []
        }
        setMessages([...messages, optimisticMsg])
        setNewMessage('')
        setReplyTo(null)

        try {
            const res = await fetch(`/api/communities/${communityId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: optimisticMsg.content,
                    reply_to_id: optimisticMsg.reply_to_id
                })
            })

            if (!res.ok) {
                toast.error("Failed to send message")
                // Revert or handle error
            } else {
                await fetchMessages() // Sync real ID
            }
        } catch (error) {
            toast.error("Network error")
        }
    }

    // Helper to render content with @mentions
    const renderContent = (content: string) => {
        const parts = content.split(/(@\w+)/g)
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} className="text-blue-400 font-bold bg-blue-400/10 px-1 rounded cursor-pointer hover:bg-blue-400/20">{part}</span>
            }
            return part
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1200px] mx-auto pt-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-4 px-4 bg-black z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-xl rounded-none">
                        <Hash className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-white text-lg font-bold tracking-widest uppercase">Community_{communityId}</h1>
                        <p className="text-gray-400 text-xs font-mono tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live_Connection
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-white/5 border border-white/10 px-3 py-1.5 w-64">
                        <Search className="w-4 h-4 text-gray-500 mr-2" />
                        <input type="text" placeholder="Search messages..." className="bg-transparent border-none text-xs text-white placeholder-gray-600 focus:outline-none w-full font-mono" />
                    </div>
                    <button className="text-gray-400 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono gap-4">
                        <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                        <p className="tracking-widest">DECRYPTING_STREAM...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono opacity-50">
                        <p>No messages yet. Start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user_id === currentUser?.id;
                        const prevMsg = messages[index - 1];
                        const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 60000 * 5); // 5 mins gap

                        return (
                            <div key={msg.id} className={`group flex gap-4 ${showHeader ? 'mt-6' : 'mt-1'} px-2 hover:bg-white/5 py-1 -mx-2 transition-colors`}>
                                {/* Avatar column */}
                                <div className="w-10 flex-shrink-0">
                                    {showHeader ? (
                                        <div className="w-10 h-10 bg-gray-800 border border-white/20 flex items-center justify-center overflow-hidden">
                                            {/* Placeholder Avatar */}
                                            <User className="text-gray-500 w-6 h-6" />
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-600 font-mono text-right opacity-0 group-hover:opacity-100 mt-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>

                                {/* Content column */}
                                <div className="flex-1 min-w-0">
                                    {showHeader && (
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-white font-bold hover:underline cursor-pointer tracking-wide">
                                                {isMe ? 'You' : `User_${msg.user_id.slice(0, 4)}`}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    )}

                                    {msg.reply_to_id && showHeader && (
                                        <div className="flex items-center gap-2 mb-1 opacity-60 text-xs">
                                            <div className="w-8 border-t-2 border-l-2 border-gray-600 h-3 rounded-tl ml-2"></div>
                                            <span className="text-gray-400 italic">Replying to a message...</span>
                                        </div>
                                    )}

                                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                        {renderContent(msg.content)}
                                    </div>
                                </div>

                                {/* Actions (Hover) */}
                                <div className="opacity-0 group-hover:opacity-100 flex items-start gap-2 pt-1 transition-opacity">
                                    <button
                                        onClick={() => setReplyTo(msg)}
                                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Reply"
                                    >
                                        <Reply className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black border-t border-white/20 z-10">
                {replyTo && (
                    <div className="flex items-center justify-between bg-white/5 border-l-2 border-blue-500 p-2 mb-2 text-xs text-gray-400">
                        <span>Replying to User_{replyTo.user_id.slice(0, 4)}</span>
                        <button onClick={() => setReplyTo(null)} className="hover:text-white">✕</button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-white/5 border border-white/20 p-2 focus-within:border-white transition-colors">
                    <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
                        <div className="w-6 h-6 border border-current rounded-full flex items-center justify-center font-light text-lg">+</div>
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={replyTo ? `Replying to User_${replyTo.user_id.slice(0, 4)}...` : `Message #${communityId}`}
                        className="flex-1 bg-transparent border-none text-white focus:outline-none py-2 px-2 font-mono text-sm max-h-32"
                    />
                    <div className="flex items-center gap-1 pr-2">
                        <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors" title="Upload Image (Mock)">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                    </div>
                </form>
                <div className="mt-2 text-[10px] text-gray-600 font-mono flex justify-end">
                    <span>Markdown Enabled</span>
                    <span className="mx-2">|</span>
                    <span>Enter to send</span>
                </div>
            </div>
        </div>
    )
}
