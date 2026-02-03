'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Friend {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    // Mock fields for UI
    score: number;
    velocity: number;
    level: number;
}

export default function LeaderboardPage() {
    const [friends, setFriends] = useState<Friend[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchFriends() {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.provider_token) {
                try {
                    const res = await fetch('https://api.github.com/user/following?per_page=10', {
                        headers: { Authorization: `Bearer ${session.provider_token}` }
                    })

                    if (res.ok) {
                        const data = await res.json()
                        // Augment with mock data for the leaderboard visuals
                        const rankedFriends = data.map((f: any) => ({
                            ...f,
                            score: Math.floor(Math.random() * (99 - 70 + 1)) + 70, // Random score 70-99
                            velocity: Math.floor(Math.random() * 150) - 20, // Random velocity
                            level: Math.floor(Math.random() * 50) + 10 // Random level
                        })).sort((a: Friend, b: Friend) => b.score - a.score)

                        setFriends(rankedFriends)
                    }
                } catch (error) {
                    console.error("Failed to fetch friends", error)
                }
            }
            setLoading(false)
        }
        fetchFriends()
    }, [])

    return (
        <div className="w-full max-w-[1000px] mx-auto pt-4">
            <div className="w-full border-b border-white/20 pb-6 mb-8">
                <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight tracking-wider mb-2">
                    Leaderboard
                </h1>
                <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm tracking-widest font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 animate-pulse"></span>
                        &gt; Ranking_System // Friends_Network
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-gray-500">
                        <span>LAST UPDATED: LIVE</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col w-full border border-white bg-black min-h-[400px]">
                {/* Header */}
                <div className="grid grid-cols-12 border-b border-white bg-white text-black font-bold tracking-widest text-xs md:text-sm">
                    <div className="col-span-2 md:col-span-1 p-4 border-r border-black flex items-center justify-center">Rank</div>
                    <div className="col-span-5 md:col-span-7 p-4 border-r border-black flex items-center">Developer</div>
                    <div className="col-span-2 md:col-span-2 p-4 border-r border-black flex items-center justify-end">Score Card</div>
                    <div className="col-span-3 md:col-span-2 p-4 flex items-center justify-end">Velocity</div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono gap-4">
                        <span className="material-symbols-outlined animate-spin text-3xl">hub</span>
                        <p className="tracking-widest">SCANNING NETWORK NODES...</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono p-12 text-center">
                        <p className="mb-4">No friends found in your network.</p>
                        <p className="text-xs">Try following people on GitHub to see them here.</p>
                    </div>
                ) : (
                    friends.map((friend, index) => (
                        <div key={friend.id} className="grid grid-cols-12 border-b border-white/20 hover:bg-white/5 transition-colors group">
                            <div className={`col-span-2 md:col-span-1 p-4 border-r border-white/20 flex items-center justify-center font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {index === 0 ? <span className="material-symbols-outlined text-lg">emoji_events</span> : String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="col-span-5 md:col-span-7 p-4 border-r border-white/20 flex items-center gap-3">
                                <div className={`w-6 h-6 md:w-8 md:h-8 border border-white flex items-center justify-center ${index === 0 ? 'bg-white text-black' : 'bg-black text-white'} font-bold text-xs`}>
                                    <img src={friend.avatar_url} alt={friend.login} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                </div>
                                <div className="flex flex-col">
                                    <a href={`/analysis?username=${friend.login}`} className="font-bold text-white text-xs md:text-sm tracking-widest hover:underline decoration-white underline-offset-4">@{friend.login}</a>
                                    <span className="text-[10px] text-gray-500 tracking-wider hidden sm:block">Lvl. {friend.level} • Developer</span>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-2 p-4 border-r border-white/20 flex items-center justify-end font-mono text-white">
                                {friend.score}%
                            </div>
                            <div className={`col-span-3 md:col-span-2 p-4 flex items-center justify-end font-mono text-xs ${friend.velocity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {friend.velocity > 0 ? '+' : ''}{friend.velocity}%
                                <span className="material-symbols-outlined text-sm ml-1">
                                    {friend.velocity >= 0 ? 'trending_up' : 'trending_down'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="w-full pt-8 flex justify-between items-center text-xs text-gray-600 tracking-widest font-mono border-t border-white/10 mt-8">
                <span>EvalHub_ Ranking Algorithm v3.1</span>
                <span>Nodes: {friends.length} Online</span>
            </div>
        </div>
    )
}
