"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Send, Image as ImageIcon, Reply, Hash, MoreVertical, Search, User, AtSign, Smile, Loader2, X } from 'lucide-react'

// --- Interfaces ---
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
    };
    reply_to_message?: {
        content: string;
        users?: { github_username: string }
    };
    // For Optimistic UI
    isOptimistic?: boolean;
    isError?: boolean;
}

interface Member {
    id: string;
    github_username: string;
    full_name: string;
    avatar_url: string;
    online_status?: string;
    last_seen?: string;
}

interface Community {
    id: string;
    name: string;
    description: string;
}

// --- Custom Hook: robust chat protocol ---
function useChatProtocol(communityId: string) {
    const supabase = createClient()
    const [status, setStatus] = useState<'INITIALIZING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('INITIALIZING')
    const [messages, setMessages] = useState<Message[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [community, setCommunity] = useState<Community | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const router = useRouter()

    // 1. Initialization Sequence
    useEffect(() => {
        let mounted = true;

        async function connect() {
            try {
                // Auth Check
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/')
                    return
                }
                if (mounted) setCurrentUser(user)

                // Parallel Fetch
                const [commRes, msgsRes, memsRes] = await Promise.all([
                    supabase.from('communities').select('*').eq('id', communityId).single(),
                    supabase.from('messages').select('*, users(github_username, avatar_url, full_name), reply_to_message:messages!reply_to_id(content, users(github_username))').eq('community_id', communityId).order('created_at', { ascending: true }).limit(100),
                    supabase.from('community_members').select('users(id, github_username, full_name, avatar_url)').eq('community_id', communityId)
                ])

                if (commRes.error) throw commRes.error

                if (mounted) {
                    setCommunity(commRes.data)
                    setMessages(msgsRes.data as any || [])

                    const mappedMembers = memsRes.data?.map((m: any) => ({
                        id: m.users.id,
                        github_username: m.users.github_username,
                        full_name: m.users.full_name,
                        avatar_url: m.users.avatar_url,
                        online_status: 'offline'
                    })) || []
                    setMembers(mappedMembers as any)

                    setStatus('CONNECTED')
                }

            } catch (err) {
                console.error("Connection Failed:", err)
                if (mounted) setStatus('ERROR')
                toast.error("Failed to establish secure connection")
            }
        }

        connect()

        return () => { mounted = false }
    }, [communityId, router])

    // 2. Realtime Subscription
    useEffect(() => {
        if (status !== 'CONNECTED') return

        const channel = supabase
            .channel(`room:${communityId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `community_id=eq.${communityId}` },
                async (payload) => {
                    const newMsg = payload.new as Message

                    // Fetch user details for the new message
                    const { data: userData } = await supabase
                        .from('users')
                        .select('github_username, avatar_url, full_name')
                        .eq('id', newMsg.user_id)
                        .single()

                    const completeMsg = { ...newMsg, users: userData }

                    setMessages(prev => {
                        // Deduplication: Check if ID exists
                        if (prev.some(m => m.id === completeMsg.id)) {
                            return prev;
                        }
                        return [...prev, completeMsg as any]
                    })
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [communityId, status])

    // 3. Robust Send Function
    const sendMessage = useCallback(async (content: string, attachments: any[], replyTo: Message | null) => {
        if (!currentUser) return

        const tempId = Date.now()
        const optimisticMsg: Message = {
            id: tempId,
            content,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            reply_to_id: replyTo?.id || null,
            attachments,
            users: {
                github_username: currentUser.user_metadata?.user_name || 'me',
                avatar_url: currentUser.user_metadata?.avatar_url || '',
                full_name: currentUser.user_metadata?.full_name || 'Me'
            },
            reply_to_message: replyTo ? {
                content: replyTo.content,
                users: { github_username: replyTo.users?.github_username || 'unknown' }
            } : undefined,
            isOptimistic: true
        }

        // Add Optimistic Message
        setMessages(prev => [...prev, optimisticMsg])

        try {
            // FORCE API ROUTE usage to ensure Profile Auto-Creation (Self-Healing)
            const res = await fetch(`/api/communities/${communityId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    attachments,
                    reply_to_id: replyTo?.id
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to send')
            }

            // Success: Remove optimistic message (Realtime will add the real one)
            // Ideally we substitute, but for simplicity we can just wait for realtime.
            // Using a simple timeout to clear optimistic message to avoid flickering before realtime arrives or if it arrived already.
            // A better way is to replace based on content match or just let it exist for a moment.
            // We'll replace it with the response data which mimics the real record.
            const realData = await res.json()

            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...realData, users: optimisticMsg.users } : m
            ))

        } catch (err: any) {
            console.error("Send Failed:", err)
            toast.error("Transmission Failed")
            // Mark as error
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isError: true } : m))
        }
    }, [communityId, currentUser])

    return {
        status,
        messages,
        members,
        community,
        currentUser,
        sendMessage
    }
}


// --- Main Page Component ---

export default function CommunityChatPage() {
    const params = useParams()
    const communityId = (Array.isArray(params.id) ? params.id[0] : params.id) || ''

    // Use our new robust protocol hook
    const { status, messages, members, community, currentUser, sendMessage } = useChatProtocol(communityId)

    const [newMessage, setNewMessage] = useState('')
    const [replyTo, setReplyTo] = useState<Message | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Scroll Logic
    useEffect(() => {
        if (status === 'CONNECTED') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages.length, status])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim()) return

        const content = newMessage
        setNewMessage('')
        const reply = replyTo
        setReplyTo(null)

        await sendMessage(content, [], reply)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Fix: Send on plain Enter (unless Shift is held for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (status === 'INITIALIZING') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-black text-white font-mono gap-4 animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin text-green-500" />
                <p className="tracking-[0.2em] text-xs">ESTABLISHING_SECURE_UPLINK...</p>
            </div>
        )
    }

    if (status === 'ERROR' || !community) {
        return <div className="p-10 text-red-500 font-mono">CONNECTION_LOST. RETRY_LATER.</div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full relative bg-black font-mono overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/20 px-6 py-3 bg-black z-20 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-white/30 flex items-center justify-center bg-white/5">
                        <Hash className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white text-base font-bold tracking-[0.1em] uppercase">
                            {community.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                                Online
                            </span>
                            <span className="text-[10px] text-gray-500 border-l border-white/20 pl-2 ml-2 tracking-wider">
                                {members.length} NODES_ACTIVE
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[url('/grid.svg')] bg-repeat opacity-[0.98]">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                            <Hash className="w-16 h-16 mb-4 text-white" />
                            <p className="tracking-widest">CHANNEL_EMPTY</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.user_id === currentUser?.id;
                            const prevMsg = messages[index - 1];
                            const isSequence = prevMsg && prevMsg.user_id === msg.user_id && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60000 * 2);

                            return (
                                <div key={msg.id} className={`flex flex-col ${isSequence ? 'mt-1' : 'mt-6'} ${isMe ? 'items-end' : 'items-start'}`}>
                                    {/* Reply Context */}
                                    {msg.reply_to_message && !isSequence && (
                                        <div className={`mb-1 flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded border-l-2 border-blue-500/50 ${isMe ? 'mr-12' : 'ml-12'}`}>
                                            <Reply className="w-3 h-3" />
                                            <span>Replying to {msg.reply_to_message.users?.github_username || 'Unknown'}</span>
                                        </div>
                                    )}

                                    <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        {!isMe && (
                                            <div className="w-8 flex-shrink-0">
                                                {!isSequence && (
                                                    <div className="w-8 h-8 rounded border border-white/20 overflow-hidden bg-black">
                                                        <img src={msg.users?.avatar_url || 'https://github.com/github.png'} alt="Av" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div
                                            className={`relative group px-4 py-2.5 rounded-sm border backdrop-blur-sm
                                            ${isMe
                                                    ? 'bg-blue-900/20 border-blue-500/30 text-white rounded-tr-none shadow-[4px_4px_0_0_rgba(59,130,246,0.1)]'
                                                    : 'bg-white/5 border-white/10 text-gray-200 rounded-tl-none hover:bg-white/10 transition-colors'
                                                }
                                            ${msg.isOptimistic ? 'opacity-70 border-dashed' : ''}
                                            ${msg.isError ? 'border-red-500 bg-red-900/10' : ''}
                                            `}
                                        >
                                            {/* Header */}
                                            {!isMe && !isSequence && (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-blue-400 tracking-wider">@{msg.users?.github_username}</span>
                                                    <span className="text-[8px] text-gray-600">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                                                </div>
                                            )}

                                            <p className="text-sm shadow-black drop-shadow-md whitespace-pre-wrap leading-relaxed">
                                                {msg.content}
                                            </p>

                                            {/* Footer/Status */}
                                            <div className="mt-1 flex justify-end gap-2 items-center text-[8px] text-gray-500">
                                                {msg.isOptimistic && <span className="animate-pulse text-yellow-500">SENDING...</span>}
                                                {msg.isError && <span className="text-red-500 font-bold">FAILED</span>}
                                            </div>

                                            {/* Quick Reply Button */}
                                            {!msg.isOptimistic && !msg.isError && (
                                                <button
                                                    onClick={() => { setReplyTo(msg); inputRef.current?.focus() }}
                                                    className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-gray-400 hover:text-white`}
                                                >
                                                    <Reply className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Sidebar */}
                <div className="w-64 border-l border-white/20 bg-black hidden lg:flex flex-col">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Operatives_Online
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer group transition-colors rounded-sm" onClick={() => router.push(`/profile/${member.github_username}`)}>
                                <div className="relative">
                                    <img src={member.avatar_url} className="w-8 h-8 grayscale group-hover:grayscale-0 transition-all border border-white/10" />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-gray-300 font-bold truncate group-hover:text-white">@{member.github_username}</span>
                                    <span className="text-[9px] text-gray-600 truncate uppercase tracking-wider">{member.full_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-black border-t border-white/20 z-20">
                {replyTo && (
                    <div className="flex items-center justify-between mb-2 bg-blue-900/20 border-l-2 border-blue-500 px-3 py-2 animate-in slide-in-from-bottom-2">
                        <span className="text-xs text-blue-300 font-mono">
                            REPLYING_TO: <span className="font-bold text-white">@{replyTo.users?.github_username}</span>
                        </span>
                        <button onClick={() => setReplyTo(null)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                )}

                <form onSubmit={handleSend} className="relative flex items-center gap-4 bg-white/5 border border-white/20 p-3 hover:border-white/40 focus-within:border-white transition-colors">
                    <button type="button" className="text-gray-500 hover:text-white transition-colors">
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="TRANSMIT_DATA..."
                        className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-gray-600 text-sm"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-white/10 hover:bg-white hover:text-black text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>

                <div className="mt-3 flex justify-between text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                    <span>SECURE_UPLINK_V3</span>
                    <span>ENTER_TO_SEND | SHIFT+ENTER_NEW_LINE</span>
                </div>
            </div>
        </div>
    )
}
