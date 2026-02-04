'use client'

import React, { useEffect, useState, useMemo, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, getDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { UserPlus, Check, MessageSquare, Clock, Wifi, Search, Github, ExternalLink, Star, GitFork, Users, Calendar, MapPin, Link as LinkIcon, Mail, Twitter, Building, X, Loader2, Terminal, Cpu, GitCommit, Activity, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'
import { toast } from 'sonner'
import { AIAssistant } from '@/components/AIAssistant'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface GitHubUser {
    login: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    name?: string;
    bio?: string;
    location?: string;
    id?: string;
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

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params)
    const [user, setUser] = useState<GitHubUser | null>(null)
    const [repos, setRepos] = useState<Repo[]>([])
    const [loading, setLoading] = useState(true)
    const [workTimeDistribution, setWorkTimeDistribution] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
    const [codeFrequency, setCodeFrequency] = useState<'High' | 'Medium' | 'Low'>('Low')

    // Social / Internal Profile State
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [profileId, setProfileId] = useState<string | null>(null)
    const [friendRequest, setFriendRequest] = useState<any>(null)
    const [requestLoading, setRequestLoading] = useState(false)
    const [presenceStatus, setPresenceStatus] = useState<'online' | 'offline' | 'away'>('offline')

    // Followers Modal State
    const [showFollowers, setShowFollowers] = useState(false)
    const [followersList, setFollowersList] = useState<any[]>([])
    const [loadingFollowers, setLoadingFollowers] = useState(false)
    const [followerSearchQuery, setFollowerSearchQuery] = useState('')

    // REPO ANALYSIS STATE
    const [analyzingRepo, setAnalyzingRepo] = useState<any>(null)
    const [remoteAnalysis, setRemoteAnalysis] = useState<any>(null)
    const [remoteCommits, setRemoteCommits] = useState<any[]>([])
    const [fetchingAnalysis, setFetchingAnalysis] = useState(false)

    const supabase = createClient()
    const router = useRouter()
    const { toast: uiToast } = useToast()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            const { data: { session } } = await supabase.auth.getSession()
            setCurrentUser(session?.user ?? null)

            const userRes = await fetch(`/api/github/user/${username}`)
            if (userRes.ok) {
                const userData = await userRes.json()
                setUser(userData)

                const { data: dbUser } = await supabase
                    .from('users')
                    .select('id, online_status')
                    .eq('github_username', username)
                    .maybeSingle()

                if (dbUser) {
                    setProfileId(dbUser.id)
                    setPresenceStatus(dbUser.online_status as any)

                    if (session?.user?.id && session.user.id !== dbUser.id) {
                        const { data: fr } = await supabase
                            .from('friend_requests')
                            .select('*')
                            .or(`and(requester_id.eq.${session.user.id},addressee_id.eq.${dbUser.id}),and(requester_id.eq.${dbUser.id},addressee_id.eq.${session.user.id})`)
                            .maybeSingle()
                        setFriendRequest(fr)
                    }
                }
            }

            const repoRes = await fetch(`/api/github/repos?username=${username}`)
            if (repoRes.ok) {
                const reposData: Repo[] = await repoRes.json()
                setRepos(reposData)

                const dist = [0, 0, 0, 0, 0, 0, 0]
                const now = new Date()
                let recentActivityCount = 0

                reposData.forEach(repo => {
                    const updateDate = new Date(repo.updated_at)
                    const daysDiff = (now.getTime() - updateDate.getTime()) / (1000 * 3600 * 24)
                    if (daysDiff < 30) {
                        const dayIndex = getDay(updateDate)
                        const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1
                        dist[mappedIndex]++
                        recentActivityCount++
                    }
                })

                const maxVal = Math.max(...dist, 1)
                setWorkTimeDistribution(dist.map(v => (v / maxVal) * 100))

                if (recentActivityCount > 10) setCodeFrequency('High')
                else if (recentActivityCount > 3) setCodeFrequency('Medium')
                else setCodeFrequency('Low')
            }
            setLoading(false)
        }
        fetchData()
    }, [username])

    const startRemoteAnalysis = async (repo: any) => {
        setAnalyzingRepo(repo)
        setFetchingAnalysis(true)
        setRemoteAnalysis(null)
        setRemoteCommits([])

        try {
            const res = await fetch('/api/github/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoFullName: repo.full_name })
            })

            if (res.ok) {
                const data = await res.json()
                setRemoteAnalysis(data.analysis)
                setRemoteCommits(data.commits || [])
            } else {
                toast.error("Analysis sequence failed. Check server logs.")
            }
        } catch (error) {
            console.error("Analysis Error:", error)
            toast.error("Connection error during analysis.")
        } finally {
            setFetchingAnalysis(false)
        }
    }

    const fetchFollowersList = async () => {
        if (followersList.length > 0) {
            setShowFollowers(true)
            return
        }

        setLoadingFollowers(true)
        setShowFollowers(true)
        try {
            const res = await fetch(`/api/github/followers?username=${username}`)
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

    const filteredFollowers = useMemo(() => {
        return followersList.filter((f: any) =>
            f.login.toLowerCase().includes(followerSearchQuery.toLowerCase())
        )
    }, [followersList, followerSearchQuery])

    const handleSendRequest = async () => {
        if (!currentUser || !profileId) return
        setRequestLoading(true)
        try {
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: profileId })
            })
            if (res.ok) {
                uiToast({ title: 'Request Sent', description: 'Connection request initiated.' })
                const { data } = await supabase
                    .from('friend_requests')
                    .select('*')
                    .eq('requester_id', currentUser.id)
                    .eq('addressee_id', profileId)
                    .maybeSingle()
                setFriendRequest(data)
            }
        } catch (e) {
            uiToast({ title: 'Error', description: 'Failed to connect.', variant: 'destructive' })
        } finally {
            setRequestLoading(false)
        }
    }

    const score = user && user.public_repos > 0 ? Math.min(100, 50 + (user.public_repos * 2)) : null
    const recentRepo = repos.length > 0 ? repos[0] : null
    const isOwnProfile = currentUser?.id === profileId

    const socialButton = useMemo(() => {
        if (!currentUser || isOwnProfile) return null
        if (!friendRequest) {
            return (
                <button
                    onClick={handleSendRequest}
                    disabled={requestLoading || !profileId}
                    className="w-full border border-white p-4 uppercase font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                >
                    <UserPlus size={18} /> {requestLoading ? 'CONNECTING...' : 'INITIATE_CONNECT'}
                </button>
            )
        }
        if (friendRequest.status === 'accepted') {
            return (
                <button
                    onClick={() => router.push(`/inbox?chat=${profileId}`)}
                    className="w-full border border-white p-4 uppercase font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 bg-white text-black"
                >
                    <MessageSquare size={18} /> OPEN_MODAL [MESSAGE]
                </button>
            )
        }
        if (friendRequest.status === 'pending') {
            const isRequester = friendRequest.requester_id === currentUser.id
            return (
                <button
                    disabled
                    className="w-full border border-white/30 p-4 uppercase font-bold tracking-[0.2em] text-white/50 flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <Clock size={18} /> {isRequester ? 'SIGNAL_PENDING' : 'RESPONSE_REQUIRED'}
                </button>
            )
        }
        return null
    }, [currentUser, friendRequest, requestLoading, profileId, isOwnProfile])

    if (loading) {
        return <div className="p-8 text-white font-mono animate-pulse uppercase tracking-widest">Awaiting System Sync: @{username}...</div>
    }

    return (
        <div className="w-full pt-4">
            <div className="w-full mb-8 flex items-end justify-between border-b border-white/20 pb-4">
                <div className="flex-1">
                    <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight tracking-wider uppercase">
                        {user?.login || username}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className={`text-sm tracking-widest font-mono ${presenceStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                            &gt; System Status: {presenceStatus.toUpperCase()}
                        </p>
                    </div>
                </div>
                {user?.avatar_url && (
                    <img
                        src={user.avatar_url}
                        alt="Profile"
                        className="w-16 h-16 border-2 border-white rounded-none transition-all ml-4 hover:grayscale cursor-crosshair"
                    />
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
                                    {isOwnProfile ? 'ACTIVE_SESSION' : 'REMOTE_PROFILE_SCAN'}
                                </div>
                                <span className={`material-symbols-outlined ${presenceStatus === 'online' ? 'animate-pulse text-green-500' : 'text-gray-600'}`}>wifi</span>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="w-24 h-24 border border-white flex flex-col items-center justify-center bg-black">
                                        <span className="material-symbols-outlined text-3xl">grid_view</span>
                                        <span className="text-xl font-bold mt-1">{user?.public_repos || 0}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">Repos</span>
                                    </div>
                                    <button
                                        onClick={fetchFollowersList}
                                        className="w-24 h-24 border border-white flex flex-col items-center justify-center bg-black hover:bg-white hover:text-black transition-all group/box"
                                    >
                                        <span className="material-symbols-outlined text-3xl">group</span>
                                        <span className="text-xl font-bold mt-1">{user?.followers || 0}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">Followers</span>
                                    </button>
                                </div>

                                <div className="mb-0">
                                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 uppercase flex items-center gap-4">
                                        <div className="w-12 h-1 bg-white"></div>
                                        Repository_Index
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border-t border-white/10 pt-6">
                                        {repos.map((repo, i) => (
                                            <div
                                                key={repo.id}
                                                onClick={() => startRemoteAnalysis(repo)}
                                                className="border border-white/20 p-4 hover:border-white hover:bg-white/5 transition-all cursor-pointer group/repo flex flex-col justify-between"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-white font-bold tracking-widest uppercase truncate max-w-[150px]">{repo.name}</span>
                                                    <span className="text-[10px] border border-white/20 px-2 py-0.5 text-gray-500 font-bold uppercase">{repo.language || 'DATA'}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 line-clamp-2 mb-4 font-mono">
                                                    {repo.description || 'NO_METADATA_AVAILABLE'}
                                                </p>
                                                <div className="flex justify-between items-center text-[10px] font-bold text-white/40 tracking-widest group-hover/repo:text-white transition-colors">
                                                    <span>SCAN_CMD: [INIT]</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">star</span> {repo.stargazers_count}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {repos.length === 0 && <span className="text-gray-500 col-span-2 text-center py-12 border border-dashed border-white/10">No public projects scanned.</span>}
                                    </div>
                                </div>


                                <div className="w-full h-[1px] bg-white mt-6"></div>
                                <div className="flex flex-wrap gap-4 md:gap-8 text-xs text-gray-400 tracking-widest">
                                    <span>Last_Update: {recentRepo ? formatDistanceToNow(new Date(recentRepo.updated_at)) : 'N/A'} ago</span>
                                    <span>Sync: GitHub_Live</span>
                                    <span>Status: Valid_Scan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="border border-white p-6 bg-black flex flex-col justify-between min-h-[180px] rounded-none group hover:bg-white hover:text-black transition-colors duration-300 cursor-default">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-bold tracking-widest uppercase">Remote Score Card</p>
                            <span className="material-symbols-outlined text-sm">analytics</span>
                        </div>
                        <div>
                            <p className="text-6xl font-bold tracking-tighter mt-2">{score === null ? 'NULL' : `${score}%`}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                <p className="text-xs font-bold tracking-widest uppercase">Calculated Growth</p>
                            </div>
                        </div>
                    </div>

                    <div className="border border-white p-6 bg-black flex-1 flex flex-col rounded-none min-h-[250px]">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm font-bold tracking-widest uppercase">Active Work Pulse</p>
                            <p className="text-xs text-gray-400 animate-pulse">Live_Feed</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between gap-2 h-full">
                            {workTimeDistribution.map((h, i) => (
                                <div key={i} className="w-full bg-white/20 relative group" style={{ height: `${Math.max(h, 5)}%` }}>
                                    <div className="absolute bottom-0 w-full bg-white h-full hover:bg-gray-300 transition-all" title={`${Math.round(h)}% Activity`}></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-mono tracking-widest">
                            <span>MON</span>
                            <span>WED</span>
                            <span>SUN</span>
                        </div>
                    </div>
                </div>

                {/* BOTTOM STAT CARDS - MATCHING PERSONAL PROFILE */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    <div
                        onClick={fetchFollowersList}
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

            {/* FOLLOWERS MODAL */}
            {showFollowers && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowFollowers(false)}>
                    <div className="bg-black border border-white w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-4">
                            <h2 className="text-xl font-bold tracking-widest uppercase">Remote_Followers_List</h2>
                            <button onClick={() => setShowFollowers(false)} className="text-white hover:text-gray-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            <input
                                type="text"
                                value={followerSearchQuery}
                                onChange={(e) => setFollowerSearchQuery(e.target.value)}
                                placeholder="Search node by username..."
                                className="w-full bg-black border border-white p-3 text-sm font-sans placeholder:text-gray-700 focus:outline-none tracking-widest text-white"
                                autoFocus
                            />
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {loadingFollowers ? (
                                <div className="text-center py-8 text-gray-500 font-mono animate-pulse">Syncing User Data...</div>
                            ) : filteredFollowers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 font-mono">
                                    {followerSearchQuery ? 'NO_MATCHING_NODES_FOUND' : 'No followers found.'}
                                </div>
                            ) : (
                                filteredFollowers.map((follower: any) => (
                                    <div key={follower.id} className="flex items-center justify-between p-3 border border-white/10 hover:border-white hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <img src={follower.avatar_url} alt={follower.login} className="w-10 h-10 border border-white/20" />
                                            <div>
                                                <p className="font-bold tracking-wide">@{follower.login}</p>
                                                <a href={follower.html_url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest">
                                                    View_GitHub Profile
                                                </a>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowFollowers(false);
                                                setFollowerSearchQuery('');
                                                router.push(`/profile/${follower.login}`);
                                            }}
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
            )}

            {/* REPO ANALYSIS MODAL */}
            {analyzingRepo && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 pt-20 backdrop-blur-md" onClick={() => setAnalyzingRepo(null)}>
                    <div className="bg-black border-2 border-white w-full max-w-4xl p-8 relative animate-in slide-in-from-bottom-5 duration-300 shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden rounded-none" onClick={e => e.stopPropagation()}>
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                        <div className="relative z-10 flex flex-col h-full max-h-[85vh]">
                            <div className="flex justify-between items-start mb-8 border-b-2 border-white/20 pb-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="bg-white text-black px-2 py-0.5 text-[10px] font-black tracking-tighter uppercase font-mono">EVAL MODE</div>
                                        <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4 text-white">
                                            {analyzingRepo.name}
                                            {fetchingAnalysis && <Loader2 className="w-6 h-6 animate-spin text-white/50" />}
                                        </h2>
                                    </div>
                                    <div className="flex gap-6 text-[10px] font-bold text-gray-500 tracking-[0.3em] uppercase font-mono">
                                        <span className="flex items-center gap-2 text-white/80"><Github className="w-3 h-3" /> {username}/{analyzingRepo.name}</span>
                                        <span>SYSTEM_SYNC: {formatDistanceToNow(new Date(analyzingRepo.updated_at))} AGO</span>
                                    </div>
                                </div>
                                <button onClick={() => setAnalyzingRepo(null)} className="p-2 border border-white/20 hover:bg-white hover:text-black transition-all group/close">
                                    <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar scroll-smooth">
                                {fetchingAnalysis ? (
                                    <div className="py-32 flex flex-col items-center justify-center text-center gap-8">
                                        <div className="relative">
                                            <div className="w-24 h-24 border-4 border-white/10 rounded-none animate-pulse"></div>
                                            <div className="absolute inset-0 border-t-4 border-white animate-spin"></div>
                                        </div>
                                        <div className="font-mono space-y-3">
                                            <p className="text-2xl font-black tracking-[0.2em] animate-pulse text-white">&gt; INITIATING_AI_SYNCHRONIZATION...</p>
                                            <p className="text-[10px] text-gray-500 tracking-[0.5em] uppercase">PARSING_SOURCE_METADATA | SCANNING_README | GENERATING_TECHNICAL_OVERVIEW | FETCHING_SIGNAL_GAPS</p>
                                        </div>
                                    </div>
                                ) : remoteAnalysis ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                        {/* Left: Summary & Stats */}
                                        <div className="lg:col-span-7 space-y-12">
                                            <section className="relative">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-2 h-6 bg-white"></div>
                                                    <h3 className="text-sm font-black tracking-[0.4em] uppercase text-white/60">System_Summary</h3>
                                                </div>
                                                <div className="border-l-2 border-white/10 pl-8 relative">
                                                    <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-2 my-2 text-white/90" {...props} />,
                                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-2 my-2 text-white/90" {...props} />,
                                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                h3: ({ node, ...props }) => <h3 className="text-sm font-black text-white mt-4 mb-2 uppercase tracking-wider flex items-center gap-2" {...props} />,
                                                                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            }}
                                                        >
                                                            {remoteAnalysis.architectureNotes || "NO_README_ANALYSIS_AVAILABLE"}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <div className="flex items-center gap-3 mb-8">
                                                    <Cpu className="w-5 h-5 text-white/40" />
                                                    <h3 className="text-sm font-black tracking-[0.4em] uppercase text-white/60">Language_Composition</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {(() => {
                                                        const languages = remoteAnalysis.languages || {};
                                                        const totalBytes = Object.values(languages).reduce((sum: number, bytes: any) => sum + bytes, 0);

                                                        return Object.entries(languages)
                                                            .sort(([, a]: any, [, b]: any) => b - a)
                                                            .map(([lang, bytes]: any) => {
                                                                const percentage = ((bytes / totalBytes) * 100).toFixed(1);
                                                                return (
                                                                    <div key={lang} className="space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-2 h-2 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                                                                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white">{lang}</span>
                                                                            </div>
                                                                            <span className="text-xs font-black text-white/60">{percentage}%</span>
                                                                        </div>
                                                                        <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-gradient-to-r from-green-500 to-white transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                                                                style={{ width: `${percentage}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                    })()}
                                                </div>
                                            </section>

                                            {/* Quality Breakdown Section */}
                                            {remoteAnalysis.qualityBreakdown && (
                                                <section>
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <Activity className="w-5 h-5 text-white/40" />
                                                        <h3 className="text-sm font-black tracking-[0.4em] uppercase text-white/60">Quality_Metrics</h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {Object.entries({
                                                            'Backend Architecture': remoteAnalysis.qualityBreakdown.maintenance || 0,
                                                            'README Quality': remoteAnalysis.qualityBreakdown.readmeQuality || 0,
                                                            'Code Organization': remoteAnalysis.qualityBreakdown.codeOrganization || 0,
                                                            'Test Coverage': remoteAnalysis.qualityBreakdown.testCoverage || 0,
                                                            'Documentation': remoteAnalysis.qualityBreakdown.documentation || 0,
                                                            'Commit Activity': remoteAnalysis.qualityBreakdown.commitActivity || 0,
                                                        }).map(([name, score]) => (
                                                            <div key={name} className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">{name}</span>
                                                                    <span className="text-xs font-black text-white tabular-nums">{score}%</span>
                                                                </div>
                                                                <div className="w-full bg-white/10 h-2 overflow-hidden relative">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 ease-in-out ${score >= 80 ? 'bg-green-500' :
                                                                            score >= 60 ? 'bg-yellow-500' :
                                                                                score >= 40 ? 'bg-orange-500' :
                                                                                    'bg-red-500'
                                                                            }`}
                                                                        style={{ width: `${score}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                        </div>

                                        {/* Right: Commits & Quality */}
                                        <div className="lg:col-span-5 space-y-12">
                                            <section>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <GitCommit className="w-5 h-5 text-white/40" />
                                                    <h3 className="text-sm font-black tracking-[0.4em] uppercase text-white/60">Signal_History</h3>
                                                </div>
                                                <div className="space-y-6 font-mono">
                                                    {remoteCommits.length > 0 ? remoteCommits.map((commit: any) => (
                                                        <div key={commit.sha} className="border-l-2 border-white/20 pl-6 py-2 hover:border-white transition-all group/commit bg-white/0 hover:bg-white/5 cursor-default">
                                                            <p className="text-[11px] text-white leading-snug truncate group-hover:text-clip group-hover:whitespace-normal" title={commit.commit.message}>
                                                                {commit.commit.message}
                                                            </p>
                                                            <p className="text-[9px] text-gray-500 mt-2 uppercase tracking-widest font-black">
                                                                {commit.sha.substring(0, 8)} // {formatDistanceToNow(new Date(commit.commit.author.date))} AGO
                                                            </p>
                                                        </div>
                                                    )) : (
                                                        <p className="text-xs text-gray-600 font-mono italic text-center py-12 border border-dashed border-white/10">NO_SIGNALS_RECORDED</p>
                                                    )}
                                                </div>
                                            </section>

                                            <div className="bg-white/5 p-8 border border-white/10 space-y-6 relative overflow-hidden group/card">
                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                    <Terminal className="w-12 h-12 text-white" />
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-500">Quality_Index</span>
                                                        <div className="text-4xl font-black text-white">{remoteAnalysis.qualityScore || 0}%</div>
                                                    </div>
                                                    <div className={`text-[10px] font-bold px-2 py-1 border ${remoteAnalysis.qualityScore > 80 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'} uppercase tracking-widest`}>
                                                        {remoteAnalysis.complexity || 'PENDING'}
                                                    </div>
                                                </div>
                                                <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-white transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(255,255,255,0.7)]"
                                                        style={{ width: `${remoteAnalysis.qualityScore || 0}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[9px] text-gray-500 leading-relaxed font-mono uppercase tracking-[0.1em]">
                                                    ALGORITHMIC_VERIFICATION: Structure_{remoteAnalysis.qualityScore > 70 ? 'Optimal' : 'Standard'} // Logic_{remoteAnalysis.adaptationScore > 70 ? 'Verified' : 'Scanning'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-32 text-center space-y-8">
                                        <div className="flex flex-col items-center gap-4">
                                            <X className="w-16 h-16 text-red-500/50" />
                                            <p className="text-xl font-black tracking-widest uppercase text-red-400">Transmission_Sync_Error: [ANALYSIS_FAIL]</p>
                                        </div>
                                        <button
                                            onClick={() => startRemoteAnalysis(analyzingRepo)}
                                            className="border-2 border-white px-10 py-3 text-sm font-black hover:bg-white hover:text-black transition-all uppercase tracking-[0.4em]"
                                        >
                                            RETRY_SYNC_INIT
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 border-t-2 border-white/20 pt-8 flex justify-between items-center bg-black">
                                <a
                                    href={analyzingRepo.html_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-[0.4em] group/git"
                                >
                                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Launch_in_GitHub_External_Nodes
                                </a>
                                <div className="flex items-center gap-6">
                                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest font-mono">
                                        EST_IMPL: {remoteAnalysis?.implementationEstimate || 'N/A'}
                                    </div>
                                    <div className="text-[10px] font-black text-black bg-white px-4 py-2 uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                        Status: {fetchingAnalysis ? 'Analyzing...' : 'Ready'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant - Always Available */}
            <AIAssistant
                context={analyzingRepo && remoteAnalysis ? {
                    repositoryName: analyzingRepo.name,
                    qualityScore: remoteAnalysis.qualityScore,
                    qualityBreakdown: remoteAnalysis.qualityBreakdown,
                    languages: remoteAnalysis.languages
                } : undefined}
            />
        </div >
    )
}
