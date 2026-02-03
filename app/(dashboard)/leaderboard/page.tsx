'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Friend {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
    // Calculated fields
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
                    // 1. Fetch user's following list (Basic info)
                    const res = await fetch('https://api.github.com/user/following?per_page=15', { // Fetches top 15 friends
                        headers: { Authorization: `Bearer ${session.provider_token}` }
                    })

                    // 1b. Fetch current user (Me)
                    const meRes = await fetch('https://api.github.com/user', {
                        headers: { Authorization: `Bearer ${session.provider_token}` }
                    })

                    if (res.ok) {
                        const basicFriends = await res.json()
                        const me = meRes.ok ? await meRes.json() : null

                        // 2. Fetch detailed stats for each friend to calculate score
                        // We do this in parallel but limited to 15 to avoid rate limits
                        const friendPromises = basicFriends.map(async (f: any) => {
                            const detailRes = await fetch(`https://api.github.com/users/${f.login}`, {
                                headers: { Authorization: `Bearer ${session.provider_token}` }
                            })
                            if (detailRes.ok) return detailRes.json()
                            return null
                        })

                        const detailedFriends = (await Promise.all(friendPromises)).filter(Boolean)

                        // Add ME to the list if available
                        if (me) {
                            detailedFriends.push(me)
                        }

                        // 3. Calculate Scores & Sort
                        const rankedFriends = detailedFriends.map((f: any) => {
                            // Algorithm:
                            // Base Score = (Public Repos * 2) + (Followers * 0.5)
                            // We normalize this somewhat but keep it uncapped for "Rank"
                            const hasRepos = f.public_repos > 0;
                            const rawScore = hasRepos ? (f.public_repos * 2) + (f.followers * 0.5) + (f.public_gists * 1) : null;

                            // Velocity based on last update recency
                            // If updated in last 24h: High velocity.
                            const lastUpdate = new Date(f.updated_at).getTime();
                            const now = Date.now();
                            const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

                            let velocity = 0;
                            if (hoursSinceUpdate < 24) velocity = Math.floor(Math.random() * 20) + 80; // 80-100%
                            else if (hoursSinceUpdate < 72) velocity = Math.floor(Math.random() * 30) + 40; // 40-70%
                            else velocity = Math.floor(Math.random() * 20) - 10; // -10 to 10%

                            // Level based on account age in years
                            const accountAgeYears = (now - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
                            const level = Math.floor(accountAgeYears * 5) + 1;

                            return {
                                ...f,
                                score: rawScore === null ? -1 : Math.min(Math.round(rawScore), 9999), // Use -1 for sorting bottom
                                actualScore: rawScore, // Store null if needed
                                velocity: hasRepos ? velocity : 0,
                                level
                            }
                        }).sort((a: any, b: any) => b.score - a.score) // Sort by highest raw score

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
                    <div className="col-span-2 md:col-span-2 p-4 border-r border-black flex items-center justify-end">Score Index</div>
                    <div className="col-span-3 md:col-span-2 p-4 flex items-center justify-end">Velocity</div>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono gap-4">
                        <span className="material-symbols-outlined animate-spin text-3xl">hub</span>
                        <p className="tracking-widest">CALCULATING METRICS...</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono p-12 text-center">
                        <p className="mb-4">No friends found in your network.</p>
                        <p className="text-xs">Follow people on GitHub to generate a leaderboard.</p>
                    </div>
                ) : (
                    friends.map((friend: any, index) => (
                        <div key={friend.id} className="grid grid-cols-12 border-b border-white/20 hover:bg-white/5 transition-colors group">
                            <div className={`col-span-2 md:col-span-1 p-4 border-r border-white/20 flex items-center justify-center font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                                {index === 0 ? <span className="material-symbols-outlined text-lg">emoji_events</span> : String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="col-span-5 md:col-span-7 p-4 border-r border-white/20 flex items-center gap-3">
                                <div className={`w-8 h-8 md:w-10 md:h-10 border border-white flex items-center justify-center ${index === 0 ? 'bg-white text-black' : 'bg-black text-white'} font-bold text-xs overflow-hidden`}>
                                    <img src={friend.avatar_url} alt={friend.login} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <a href={`/analysis?username=${friend.login}`} className="font-bold text-white text-xs md:text-sm tracking-widest hover:underline decoration-white underline-offset-4">@{friend.login}</a>
                                        {index < 3 && <span className="text-[10px] bg-white text-black px-1 font-bold">TOP {index + 1}</span>}
                                    </div>
                                    <span className="text-[10px] text-gray-500 tracking-wider hidden sm:block font-mono">
                                        Level {friend.level} • {friend.public_repos} Repos • {friend.followers} Followers
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-2 p-4 border-r border-white/20 flex items-center justify-end font-mono text-white text-sm">
                                {friend.actualScore === null ? 'NULL' : friend.actualScore.toLocaleString()}
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

        </div>
    )
}
