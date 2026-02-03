'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

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
    const supabase = createClient()

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

                // Fetch Repos
                const repoRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
                    headers: { Authorization: `Bearer ${session.provider_token}` }
                })
                if (repoRes.ok) setRepos(await repoRes.json())
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return <div className="p-8 text-white font-mono animate-pulse">Loading Profile Data...</div>
    }

    // fallback for score calculation (just a fun metric based on repo count * 5 capped at 100)
    const score = user ? Math.min(100, 50 + (user.public_repos * 2)) : 0
    const recentRepo = repos.length > 0 ? repos[0] : null

    return (
        <div className="w-full pt-4">
            <div className="w-full mb-8 flex items-end justify-between border-b border-white/20 pb-4">
                <div>
                    <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight tracking-wider">
                        {user?.login || "User_Profile"}
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 tracking-widest font-mono">&gt; System Status: Online</p>
                </div>
                {user?.avatar_url && (
                    <img src={user.avatar_url} alt="Profile" className="w-16 h-16 border-2 border-white rounded-none grayscale hover:grayscale-0 transition-all" />
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
                                    <button className="w-24 h-24 border border-white flex flex-col items-center justify-center bg-black hover:bg-white hover:text-black transition-colors duration-300">
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
                            <p className="text-6xl font-bold tracking-tighter mt-2">{score}%</p>
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
                            {/* Mock bars for visual consistency, could be wired to actual commit days later */}
                            {[30, 45, 35, 60, 50, 75, 65].map((h, i) => (
                                <div key={i} className="w-full bg-white/20 relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute bottom-0 w-full bg-white h-full hover:bg-gray-300 transition-all"></div>
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
                    <div className="border border-white p-6 bg-black flex flex-col gap-4 rounded-none hover:bg-white hover:text-black transition-colors duration-300 group cursor-pointer">
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
                        <p className="text-4xl font-bold tracking-tight">High</p>
                        <div className="flex gap-1 mt-auto">
                            <div className="h-1 flex-1 bg-white group-hover:bg-black"></div>
                            <div className="h-1 flex-1 bg-white group-hover:bg-black"></div>
                            <div className="h-1 flex-1 bg-white group-hover:bg-black"></div>
                            <div className="h-1 flex-1 bg-gray-800 group-hover:bg-black/20"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full pt-4 border-t border-dashed border-white/30 flex justify-between text-xs text-gray-500 tracking-widest mt-8">
                <span>EvalHub_ OS v2.0.4</span>
                <span className="animate-pulse">_Cursor_Active</span>
                <span>Mem: 64K OK</span>
            </div>
        </div>
    )
}
