'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ProjectAnalysis } from '@/lib/gemini'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Repo {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
        avatar_url: string;
    }
    description: string;
    language: string;
    updated_at: string;
}

function AnalysisContent() {
    const [repos, setRepos] = useState<Repo[]>([])
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
    const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null)
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [searchUsername, setSearchUsername] = useState('')
    const [searchedUser, setSearchedUser] = useState<{ login: string, avatar_url: string } | null>(null)
    const [isFollowing, setIsFollowing] = useState(false)

    const supabase = createClient()
    const searchParams = useSearchParams()
    const router = useRouter()

    // Handle initial mount and query params
    useEffect(() => {
        const queryUser = searchParams.get('username')
        if (queryUser) {
            setSearchUsername(queryUser)
            handleSearchUserInternal(queryUser)
        } else {
            fetchUserRepos()
        }
    }, [searchParams])

    const fetchUserRepos = async () => {
        setLoading(true)
        setSearchedUser(null)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
                headers: {
                    Authorization: `Bearer ${session.provider_token}`,
                    Accept: "application/vnd.github.v3+json",
                }
            });
            if (response.ok) {
                const data = await response.json()
                setRepos(data)
            }
        }
        setLoading(false)
    }

    const checkIfFollowing = async (username: string, token: string) => {
        try {
            const res = await fetch(`https://api.github.com/user/following/${username}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.status === 204) setIsFollowing(true)
            else setIsFollowing(false)
        } catch (e) {
            console.error(e)
        }
    }

    const handleSearchUserInternal = async (username: string) => {
        if (!username.trim()) return

        setLoading(true)
        setRepos([])

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.provider_token

            const headers: HeadersInit = {
                "Accept": "application/vnd.github.v3+json"
            }
            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }

            // 1. Fetch Repos
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, { headers });

            if (response.ok) {
                const data = await response.json()
                setRepos(data)
                const ownerLogin = data.length > 0 ? data[0].owner.login : null;

                if (ownerLogin) {
                    setSearchedUser({
                        login: ownerLogin,
                        avatar_url: data[0].owner.avatar_url
                    })
                    if (token) checkIfFollowing(ownerLogin, token)
                } else {
                    // try fetch user directly if no repos
                    const uRes = await fetch(`https://api.github.com/users/${username}`, { headers });
                    if (uRes.ok) {
                        const uData = await uRes.json()
                        setSearchedUser({ login: uData.login, avatar_url: uData.avatar_url })
                        if (token) checkIfFollowing(uData.login, token)
                    }
                }
            } else {
                setRepos([])
                setSearchedUser(null)
                console.error("Repo fetch failed:", response.status)
                toast.error("User not found or API limit reached.")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleSearchUserInternal(searchUsername)
    }

    const handleAnalyze = async (repo: Repo) => {
        setSelectedRepo(repo)
        setAnalyzing(true)
        setAnalysis(null)

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: JSON.stringify({ repoName: repo.name, owner: repo.owner.login }),
            })

            if (res.ok) {
                const data = await res.json()
                setAnalysis(data)
            } else {
                toast.error("Analysis failed. Please try again.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleAddFriend = async () => {
        if (!searchedUser) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.provider_token) {
                const res = await fetch(`https://api.github.com/user/following/${searchedUser.login}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${session.provider_token}`,
                        "Content-Length": "0"
                    }
                })

                if (res.status === 204) {
                    setIsFollowing(true)
                    toast.success(`You are now following ${searchedUser.login}!`)
                } else {
                    toast.error("Failed to follow user.")
                }
            }
        } catch (error) {
            console.error(error)
            toast.error("Error sending request.")
        }
    }

    return (
        <div className="w-full pt-4">
            <div className="w-full mb-8 border-b border-white/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight tracking-wider">
                        Project Analysis
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 tracking-widest font-mono">&gt; AI_Module // Interview_Prep_Mode</p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Search GitHub User..."
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            className="bg-black border border-white/30 text-white pl-9 pr-4 py-2 text-xs font-mono w-[250px] focus:outline-none focus:border-white transition-colors"
                        />
                    </div>
                    <Button type="submit" variant="outline" className="h-9 border-white hover:bg-white hover:text-black rounded-none text-xs font-bold tracking-widest">
                        GO
                    </Button>
                    {searchUsername && (
                        <Button type="button" onClick={() => { setSearchUsername(''); fetchUserRepos(); setSearchedUser(null); window.history.pushState({}, '', '/analysis') }} variant="ghost" className="h-9 text-xs text-gray-400 hover:text-white">
                            Clear
                        </Button>
                    )}
                </form>
            </div>

            {/* Searched User Profile Header */}
            {searchedUser && !selectedRepo && (
                <div className="mb-8 p-6 border border-white bg-white/5 flex flex-col md:flex-row items-start md:items-center justify-between animate-in fade-in slide-in-from-top-4 gap-4">
                    <div className="flex items-center gap-4">
                        <img src={searchedUser.avatar_url} alt={searchedUser.login} className="w-16 h-16 rounded-full border-2 border-white" />
                        <div>
                            <h2 className="text-2xl font-bold tracking-widest">{searchedUser.login}</h2>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                GitHub User
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleAddFriend}
                            disabled={isFollowing}
                            className={`font-bold tracking-widest font-mono border border-white ${isFollowing ? 'bg-black text-white cursor-default hover:bg-black hover:text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            <span className="material-symbols-outlined text-sm mr-2">{isFollowing ? 'check' : 'person_add'}</span>
                            {isFollowing ? 'FRIEND ADDED' : 'ADD FRIEND'}
                        </Button>
                        <Button onClick={() => window.location.href = '/leaderboard'} variant="outline" className="border-white text-white hover:bg-white hover:text-black font-mono font-bold tracking-widest">
                            <span className="material-symbols-outlined text-sm mr-2">group</span>
                            VIEW FRIENDS
                        </Button>
                    </div>
                </div>
            )}

            {!selectedRepo && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full border border-dashed border-white/30 p-12 flex flex-col items-center justify-center text-gray-500 font-mono">
                            <span className="material-symbols-outlined animate-spin text-3xl mb-4">sync</span>
                            Scanning Repositories...
                        </div>
                    ) : repos.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 font-mono py-12">
                            No public repositories found for this user.
                        </div>
                    ) : (
                        repos.map((repo) => (
                            <div key={repo.id} onClick={() => handleAnalyze(repo)} className="border border-white p-6 bg-black hover:bg-white hover:text-black transition-colors cursor-pointer group flex flex-col justify-between h-[200px]">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold tracking-widest truncate w-full">{repo.name}</h3>
                                        {repo.language && <span className="text-[10px] border border-gray-500 px-1 font-mono uppercase group-hover:border-black">{repo.language}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono line-clamp-3 group-hover:text-black/70">
                                        {repo.description || "No description provided."}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs font-bold tracking-widest uppercase">
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                        Analyze
                                    </span>
                                    <span className="opacity-50 text-[10px]">{repo.owner.login}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {analyzing && (
                <div className="min-h-[400px] flex flex-col items-center justify-center border border-dashed border-white/30 bg-black text-white p-12">
                    <span className="material-symbols-outlined text-6xl animate-spin mb-4">data_usage</span>
                    <h2 className="text-2xl font-bold tracking-widest animate-pulse">ANALYZING CODEBASE...</h2>
                    <div className="mt-4 font-mono text-sm text-gray-400 space-y-1 text-center">
                        <p>&gt; Reading File Structure...</p>
                        <p>&gt; Parsing README.md...</p>
                        <p>&gt; Generating Score Card...</p>
                        <p>&gt; Synthesizing Interview Questions...</p>
                    </div>
                </div>
            )}

            {analysis && selectedRepo && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <Button onClick={() => setSelectedRepo(null)} variant="outline" className="border-white text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">
                            &lt; Back to Repos
                        </Button>
                        <h2 className="text-xl font-bold tracking-tighter">{selectedRepo.full_name}</h2>
                    </div>

                    {/* Overview & Score Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 border border-white p-8 bg-black">
                            <h3 className="text-lg font-bold tracking-widest mb-6 border-b border-white/20 pb-2">Tech Stack Detected</h3>
                            <div className="flex flex-wrap gap-3">
                                {analysis.techStack.map((tech) => (
                                    <span key={tech} className="border border-white px-3 py-1 text-sm font-mono hover:bg-white hover:text-black transition-colors cursor-default">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-8">
                                <h3 className="text-lg font-bold tracking-widest mb-4 border-b border-white/20 pb-2">Complexity Assessment</h3>
                                <div className="flex items-center gap-4">
                                    <span className={`text-4xl font-bold ${analysis.complexity === 'Advanced' ? 'text-red-500' : analysis.complexity === 'Intermediate' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {analysis.complexity}
                                    </span>
                                    <div className="h-2 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-1000"
                                            style={{ width: `${analysis.completeness}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-mono text-sm">{analysis.completeness}% Complete</span>
                                </div>
                            </div>
                        </div>

                        <div className="border border-white p-8 bg-black flex flex-col justify-between">
                            <h3 className="text-lg font-bold tracking-widest mb-4">Project Score</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-mono mb-1">
                                        <span>Clean Code</span>
                                        <span>{analysis.scoreCard.cleanCode}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1"><div className="bg-green-400 h-full" style={{ width: `${analysis.scoreCard.cleanCode}%` }}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-mono mb-1">
                                        <span>Architecture</span>
                                        <span>{analysis.scoreCard.architecture}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1"><div className="bg-blue-400 h-full" style={{ width: `${analysis.scoreCard.architecture}%` }}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-mono mb-1">
                                        <span>Best Practices</span>
                                        <span>{analysis.scoreCard.bestPractices}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1"><div className="bg-purple-400 h-full" style={{ width: `${analysis.scoreCard.bestPractices}%` }}></div></div>
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <span className="text-6xl font-bold tracking-tighter">
                                    {Math.round((analysis.scoreCard.cleanCode + analysis.scoreCard.architecture + analysis.scoreCard.bestPractices) / 3)}
                                </span>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Overall Quality Score</p>
                            </div>
                        </div>
                    </div>

                    {/* Interview Questions */}
                    <div className="border border-white p-8 bg-black">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold tracking-widest">Generated Interview Questions</h3>
                            <span className="text-xs font-mono text-gray-500">Based on your source code</span>
                        </div>

                        <div className="space-y-6">
                            {analysis.interviewQuestions.map((q, i) => (
                                <div key={i} className="group border-l-2 border-white/20 pl-6 hover:border-white transition-colors py-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] px-2 py-0.5 border ${q.difficulty === 'Hard' ? 'border-red-500 text-red-500' : q.difficulty === 'Medium' ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'} uppercase tracking-widest`}>
                                            {q.difficulty}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">Context: {q.context}</span>
                                    </div>
                                    <h4 className="text-lg md:text-xl font-bold leading-relaxed">{q.question}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function AnalysisPage() {
    return (
        <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
            <AnalysisContent />
        </Suspense>
    )
}
