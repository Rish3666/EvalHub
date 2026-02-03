'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface FriendRequest {
    id: string;
    created_at: string;
    requester: {
        id: string;
        github_username: string;
        avatar_url: string;
        full_name: string;
    }
}

export default function InboxPage() {
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchRequests()
    }, [])

    async function fetchRequests() {
        setLoading(true)
        try {
            const res = await fetch('/api/inbox')
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (error) {
            console.error("Failed to fetch inbox", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleRespond(requestId: string, action: 'accepted' | 'declined') {
        try {
            const res = await fetch('/api/friends/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action })
            })

            if (res.ok) {
                toast.success(`Request ${action === 'accepted' ? 'accepted' : 'ignored'}`)
                setRequests(requests.filter(r => r.id !== requestId))
            } else {
                toast.error("Failed to respond to request")
            }
        } catch (error) {
            toast.error("Network error")
        }
    }

    return (
        <div className="w-full max-w-[800px] mx-auto pt-4">
            <div className="w-full mb-12 border-b border-white/20 pb-6">
                <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight tracking-tighter">
                    Inbox
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-2 tracking-widest font-mono">&gt; Communication_Array // Pending_Requests: {requests.length}</p>
            </div>

            <div className="flex flex-col gap-6">
                {loading ? (
                    <div className="text-center py-20 text-gray-500 font-mono animate-pulse">Checking incoming logs...</div>
                ) : requests.length === 0 ? (
                    <div className="border border-dashed border-gray-800 p-12 text-center text-gray-500 font-mono">
                        <span className="material-symbols-outlined text-4xl opacity-50 mb-2">inbox</span>
                        <p>INBOX_EMPTY</p>
                        <p className="text-xs mt-2">Zero pending connection requests detected.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="border border-white p-6 bg-black flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="h-16 w-16 border border-white flex items-center justify-center bg-white overflow-hidden shrink-0">
                                    <img src={req.requester.avatar_url || "/placeholder-user.png"} alt={req.requester.github_username} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-widest uppercase">@{req.requester.github_username || "Anonymous"}</h2>
                                    <p className="text-xs text-gray-400 font-mono tracking-tighter">
                                        wants to connect • {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleRespond(req.id, 'accepted')}
                                    className="flex-1 md:flex-none px-6 py-2 bg-white text-black font-bold text-xs tracking-widest hover:bg-gray-200 transition-colors uppercase"
                                >
                                    Accept_
                                </button>
                                <button
                                    onClick={() => handleRespond(req.id, 'declined')}
                                    className="flex-1 md:flex-none px-6 py-2 border border-white text-white font-bold text-xs tracking-widest hover:bg-white hover:text-black transition-colors uppercase"
                                >
                                    Ignore_
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    )
}
