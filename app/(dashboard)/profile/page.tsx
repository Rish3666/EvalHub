'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, getDay } from 'date-fns'
import { useRouter } from 'next/navigation'

interface GitHubUser {
    login: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
}

interface Repo {
    id: number;
    name: string;
    description: string;
    language: string;
    stargazers_count: number;
    updated_at: string;
    private: boolean;
    html_url: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<GitHubUser | null>(null)
    const [repos, setRepos] = useState<Repo[]>([])
    const [loading, setLoading] = useState(true)
    const [workTimeDistribution, setWorkTimeDistribution] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
    const [codeFrequency, setCodeFrequency] = useState<'High' | 'Medium' | 'Low'>('Low')
    const [showFollowers, setShowFollowers] = useState(false)
    const [followersList, setFollowersList] = useState<any[]>([])
    const [loadingFollowers, setLoadingFollowers] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.provider_token) {
                // Fetch User
                const userRes = await fetch('https://api.github.com/user', {
                    headers: { Authorization: `Bearer ${session.provider_token}` }
                })
                if (userRes.ok) setUser(await userRes.json())

                // Fetch Repos (More to get better stats)
                const repoRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
                    headers: { Authorization: `Bearer ${session.provider_token}` }
                })

                if (repoRes.ok) {
                    const reposData: Repo[] = await repoRes.json()
                    setRepos(reposData)

                    // Calculate Work Time Distribution (Mon-Sun)
                    const dist = [0, 0, 0, 0, 0, 0, 0] // Sun=0, Mon=1...
                    const now = new Date()
                    let recentActivityCount = 0

                    reposData.forEach(repo => {
                        const updateDate = new Date(repo.updated_at)
                        // Only count updates in last 30 days for relevant "Work Time" stats
                        const daysDiff = (now.getTime() - updateDate.getTime()) / (1000 * 3600 * 24)

                        if (daysDiff < 30) {
                            const dayIndex = getDay(updateDate) // 0-6 (Sun-Sat)
                            // Map to Mon-Sun (0-6) where Mon=0
                            const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1
                            dist[mappedIndex]++
                            recentActivityCount++
                        }
                    })

                    // Normalize for visual bars (percentage of max)
                    const maxVal = Math.max(...dist, 1)
                    const visualDist = dist.map(v => (v / maxVal) * 100)
                    setWorkTimeDistribution(visualDist)

                    // Calculate Code Frequency
                    if (recentActivityCount > 10) setCodeFrequency('High')
                    else if (recentActivityCount > 3) setCodeFrequency('Medium')
                    else setCodeFrequency('Low')
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const fetchFollowers = async () => {
        if (followersList.length > 0) {
            setShowFollowers(true)
            return
        }

        setLoadingFollowers(true)
        setShowFollowers(true)
        try {
            const res = await fetch('/api/github/followers')
            if (res.ok) {
                const data = await res.json()
                setFollowersList(data)
            }
        } catch (error) {
            console.error('Failed to fetch followers', error)
        } finally {
            setLoadingFollowers(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-white font-mono animate-pulse">Loading Profile Data...</div>
    }

    // fallback for score calculation (just a fun metric based on repo count * 5 capped at 100)
    const score = user && user.public_repos > 0 ? Math.min(100, 50 + (user.public_repos * 2)) : null
    const recentRepo = repos.length > 0 ? repos[0] : null

    return (
        <div className="w-full pt-4">
            <div className="w-full mb-8 flex items-end justify-between border-b border-white/20 pb-4">
                <div className="flex-1">
                    <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight tracking-wider uppercase">
                        {user?.login || "User_Profile"}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-gray-400 text-sm tracking-widest font-mono">&gt; System Status: Online</p>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-red-500 border border-red-500/50 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-all uppercase font-bold tracking-widest bg-red-500/5"
                        >
                            Terminate_Session [Logout]
                        </button>
                    </div>
                </div>
                {user?.avatar_url && (
                    <img src={user.avatar_url} alt="Profile" className="w-16 h-16 border-2 border-white rounded-none grayscale hover:grayscale-0 transition-all ml-4" />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
                <div className="lg:col-span-8 flex flex-col h-full min-h-[400px]">
                    <div className="flex-1 border border-white p-6 relative group overflow-hidden bg-black rounded-none">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className="border border-white px-2 py-1 text-xs font-bold bg-black text-white inline-block mb-4">
                                    Active_Session
                                </div>
                                <span className="material-symbols-outlined animate-pulse">wifi</span>
                            </div>
                            <div className="mt-auto space-y-4">
                                <div className="flex items-center gap-6 mb-4">
                                    <button className="w-24 h-24 border border-white flex flex-col items-center justify-center bg-black hover:bg-white hover:text-black transition-colors duration-300">
                                        <span className="material-symbols-outlined text-3xl">grid_view</span>
                                        <span className="text-xl font-bold mt-1">{user?.public_repos || 0}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">Repos</span>
                                    </button>
                                    <button
                                        onClick={fetchFollowers}
                                        className="w-24 h-24 border border-white flex flex-col items-center justify-center bg-black hover:bg-white hover:text-black transition-colors duration-300"
                                    >
                                        <span className="material-symbols-outlined text-3xl">group</span>
                                        <span className="text-xl font-bold mt-1">{user?.followers || 0}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">Followers</span>
                                    </button>
                                </div>

                                <div>
                                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">Latest Projects</h2>
                                    <div className="border-l-2 border-white pl-4 flex flex-col gap-2 font-mono">
                                        {repos.slice(0, 4).map((repo, i) => (
                                            <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="flex justify-between items-center text-white/80 text-lg font-medium tracking-widest w-full hover:text-white hover:bg-white/10 px-2 transition-all">
                                                <span className="truncate max-w-[200px] md:max-w-none">{i + 1}) {repo.name}</span>
                                                <span className="text-xs uppercase border border-gray-600 px-1">{repo.private ? 'PVT' : 'PUB'}</span>
                                            </a>
                                        ))}
                                        {repos.length === 0 && <span className="text-gray-500">No projects found.</span>}
                                    </div>
                                </div>
                                <div className="w-full h-[1px] bg-white mt-6"></div>
                                <div className="flex flex-wrap gap-4 md:gap-8 text-xs text-gray-400 tracking-widest">
                                    <span>Last_Update: {recentRepo ? formatDistanceToNow(new Date(recentRepo.updated_at)) : 'N/A'} ago</span>
                                    <span>Joined: {user ? new Date(user.created_at).getFullYear() : 'N/A'}</span>
                                    <span>Status: Build_Stable</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="border border-white p-6 bg-black flex flex-col justify-between min-h-[180px] rounded-none group hover:bg-white hover:text-black transition-colors duration-300 cursor-default">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-bold tracking-widest">Dev Score Card</p>
                            <span className="material-symbols-outlined text-sm">analytics</span>
                        </div>
                        <div>
                            <p className="text-6xl font-bold tracking-tighter mt-2">{score === null ? 'NULL' : `${score}%`}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                <p className="text-xs font-bold tracking-widest">Based on Repo Activity</p>
                            </div>
                        </div>
                    </div>

                    <div className="border border-white p-6 bg-black flex-1 flex flex-col rounded-none min-h-[250px]">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm font-bold tracking-widest">Work Time</p>
                            <p className="text-xs text-gray-400 animate-pulse">Live</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between gap-2 h-full">
                            {workTimeDistribution.map((h, i) => (
                                <div key={i} className="w-full bg-white/20 relative group" style={{ height: `${Math.max(h, 5)}%` }}>
                                    <div className="absolute bottom-0 w-full bg-white h-full hover:bg-gray-300 transition-all" title={`${Math.round(h)}% Activity`}></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-mono tracking-widest">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Sun</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card 1 */}
                    <div className="border border-white p-6 bg-black flex flex-col gap-4 rounded-none hover:bg-white hover:text-black transition-colors duration-300 group cursor-pointer">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold tracking-widest opacity-70">Recent Project</p>
                            <span className="material-symbols-outlined group-hover:text-black text-white transition-colors">history</span>
                        </div>
                        <p className="text-xl md:text-3xl font-bold tracking-tight truncate">{recentRepo?.name || "N/A"}</p>
                        <div className="w-full bg-gray-800 h-1 mt-auto group-hover:bg-black/20">
                            <div className="bg-white h-full w-[80%] group-hover:bg-black"></div>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div
                        onClick={fetchFollowers}
                        className="border border-white p-6 bg-black flex flex-col gap-4 rounded-none hover:bg-white hover:text-black transition-colors duration-300 group cursor-pointer"
                    >
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold tracking-widest opacity-70">Followers</p>
                            <span className="material-symbols-outlined group-hover:text-black text-white transition-colors">group</span>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{user?.followers || 0}</p>
                        <div className="w-full bg-gray-800 h-1 mt-auto group-hover:bg-black/20">
                            <div className="bg-white h-full w-[10%] group-hover:bg-black"></div>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="border border-white p-6 bg-black flex flex-col gap-4 rounded-none hover:bg-white hover:text-black transition-colors duration-300 group cursor-pointer">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold tracking-widest opacity-70">Coding_Frequency</p>
                            <span className="material-symbols-outlined group-hover:text-black text-white transition-colors">speed</span>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{codeFrequency}</p>
                        <div className="flex gap-1 mt-auto">
                            <div className={`h-1 flex-1 bg-white ${codeFrequency === 'Low' || codeFrequency === 'Medium' || codeFrequency === 'High' ? 'opacity-100' : 'opacity-20'} group-hover:bg-black`}></div>
                            <div className={`h-1 flex-1 bg-white ${codeFrequency === 'Medium' || codeFrequency === 'High' ? 'opacity-100' : 'opacity-20'} group-hover:bg-black`}></div>
                            <div className={`h-1 flex-1 bg-white ${codeFrequency === 'High' ? 'opacity-100' : 'opacity-20'} group-hover:bg-black`}></div>
                            <div className="h-1 flex-1 bg-gray-800 group-hover:bg-black/20"></div>
                        </div>
                    </div>
                </div>
            </div>

            {
                showFollowers && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowFollowers(false)}>
                        <div className="bg-black border border-white w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                                <h2 className="text-xl font-bold tracking-widest uppercase">Followers_List</h2>
                                <button onClick={() => setShowFollowers(false)} className="text-white hover:text-gray-400">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {loadingFollowers ? (
                                    <div className="text-center py-8 text-gray-500 font-mono animate-pulse">Syncing User Data...</div>
                                ) : followersList.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 font-mono">No followers found.</div>
                                ) : (
                                    followersList.map((follower: any) => (
                                        <div key={follower.id} className="flex items-center justify-between p-3 border border-white/10 hover:border-white hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <img src={follower.avatar_url} alt={follower.login} className="w-10 h-10 border border-white/20" />
                                                <div>
                                                    <p className="font-bold tracking-wide">@{follower.login}</p>
                                                    <a href={follower.html_url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest">
                                                        View_GitHub Profile
                                                    </a>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/analysis?username=${follower.login}`)}
                                                className="text-[10px] border border-white/30 px-2 py-1 hover:border-white hover:bg-white hover:text-black transition-all uppercase"
                                            >
                                                Inspect
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
