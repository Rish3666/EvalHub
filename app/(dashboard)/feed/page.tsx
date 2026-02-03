'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FeedItem {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    created_at: string;
    pushed_at: string;
    stargazers_count: number;
    language: string;
    owner: {
        login: string;
        avatar_url: string;
    }
}

interface Interactions {
    [key: number]: {
        likes: number;
        comments: number;
        likedByMe: boolean;
    }
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user: {
        username: string;
        github_username: string;
        avatar_url: string;
    }
}

type FilterType = 'friends' | 'followers' | 'both';

export default function FeedPage() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('friends')
    const [interactions, setInteractions] = useState<Interactions>({})

    // Comments State
    const [activeCommentRepo, setActiveCommentRepo] = useState<FeedItem | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [newComment, setNewComment] = useState('')

    const supabase = createClient()

    useEffect(() => {
        let ismounted = true;
        async function fetchFeed() {
            setLoading(true)
            setFeedItems([]) // Clear previous items to avoid stale data from other filters

            const { data: { session } } = await supabase.auth.getSession()

            if (session?.provider_token) {
                try {
                    let uniqueUsers: any[] = [];
                    const headers = {
                        'Authorization': `Bearer ${session.provider_token}`,
                        'Accept': 'application/vnd.github+json'
                    };

                    // 1. Fetch Users based on Filter explicitly
                    if (filter === 'friends') {
                        // Fetch actual friends from internal database
                        const internalRes = await fetch('/api/friends/list');
                        if (internalRes.ok) {
                            const internalFriends = await internalRes.json();
                            uniqueUsers = internalFriends.map((u: any) => ({
                                login: u.github_username,
                                avatar_url: u.avatar_url,
                                id: u.id
                            }));
                        }
                    }
                    else if (filter === 'followers') {
                        const res = await fetch('https://api.github.com/user/followers?per_page=15', {
                            headers,
                            cache: 'no-store'
                        });
                        if (res.ok) uniqueUsers = await res.json();
                    }
                    else if (filter === 'both') {
                        const [followingRes, followersRes] = await Promise.all([
                            fetch('https://api.github.com/user/following?per_page=10', { headers, cache: 'no-store' }),
                            fetch('https://api.github.com/user/followers?per_page=10', { headers, cache: 'no-store' })
                        ]);

                        const following = followingRes.ok ? await followingRes.json() : [];
                        const followers = followersRes.ok ? await followersRes.json() : [];

                        // Deduplicate by combining and using Map
                        const combined = [...following, ...followers];
                        uniqueUsers = Array.from(new Map(combined.map((u: any) => [u.login, u])).values());
                    }


                    if (!ismounted) return;

                    if (uniqueUsers.length === 0) {
                        setFeedItems([]);
                        setLoading(false);
                        return;
                    }

                    // 2. Fetch Latest Repo for each User
                    const feedPromises = uniqueUsers.map(async (user: any) => {
                        const repoRes = await fetch(`https://api.github.com/users/${user.login}/repos?sort=pushed&per_page=1`, { headers, cache: 'no-store' });
                        if (repoRes.ok) {
                            const repos = await repoRes.json();
                            return repos.length > 0 ? repos[0] : null;
                        }
                        return null;
                    });

                    const results = await Promise.all(feedPromises);
                    const validItems = results.filter(item => item !== null);

                    // 3. Sort by pushed_at (newest first)
                    validItems.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());

                    if (ismounted) setFeedItems(validItems);

                } catch (error) {
                    console.error("Feed Error:", error)
                }
            }
            if (ismounted) setLoading(false)
        }

        fetchFeed()
        return () => { ismounted = false }
    }, [filter]) // Re-run when filter changes

    useEffect(() => {
        if (feedItems.length > 0) {
            fetchInteractions(feedItems.map(i => i.id))
        }
    }, [feedItems])

    const fetchInteractions = async (repoIds: number[]) => {
        try {
            const res = await fetch(`/api/feed/interactions?repoIds=${repoIds.join(',')}`)
            if (res.ok) {
                const data = await res.json()
                setInteractions(data)
            }
        } catch (error) {
            console.error("Failed to fetch interactions", error)
        }
    }

    const handleLike = async (repoId: number) => {
        // Optimistic Update
        setInteractions(prev => {
            const current = prev[repoId] || { likes: 0, comments: 0, likedByMe: false }
            return {
                ...prev,
                [repoId]: {
                    ...current,
                    likes: current.likedByMe ? current.likes - 1 : current.likes + 1,
                    likedByMe: !current.likedByMe
                }
            }
        })

        try {
            await fetch('/api/feed/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoId })
            })
        } catch (error) {
            console.error("Like failed", error)
            // Revert on error?? skipping for now
        }
    }

    const openComments = async (item: FeedItem) => {
        setActiveCommentRepo(item)
        setComments([])
        setLoadingComments(true)
        try {
            const res = await fetch(`/api/feed/comments?repoId=${item.id}`)
            if (res.ok) setComments(await res.json())
        } catch (error) {
            console.error("Failed comments", error)
        } finally {
            setLoadingComments(false)
        }
    }

    const postComment = async () => {
        if (!activeCommentRepo || !newComment.trim()) return

        try {
            const res = await fetch('/api/feed/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoId: activeCommentRepo.id, content: newComment })
            })

            if (res.ok) {
                const comment = await res.json()
                setComments(prev => [...prev, comment])
                setNewComment('')
                // Update count
                setInteractions(prev => ({
                    ...prev,
                    [activeCommentRepo.id]: {
                        ...prev[activeCommentRepo.id],
                        comments: prev[activeCommentRepo.id].comments + 1
                    }
                }))
            }
        } catch (error) {
            console.error("Post comment failed", error)
        }
    }

    return (
        <div className="w-full max-w-[800px] mx-auto relative">
            <div className="w-full pt-4 border-b border-white/20 pb-6 mb-12">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight tracking-wider mb-2">
                        Home
                    </h1>
                    {/* Filter Controls */}
                    <div className="flex border border-white/20 bg-black">
                        <button
                            onClick={() => setFilter('friends')}
                            className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors", filter === 'friends' ? 'bg-white text-black' : 'text-gray-400')}
                        >
                            Friends
                        </button>
                        <div className="w-[1px] bg-white/20"></div>
                        <button
                            onClick={() => setFilter('followers')}
                            className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors", filter === 'followers' ? 'bg-white text-black' : 'text-gray-400')}
                        >
                            Followers
                        </button>
                        <div className="w-[1px] bg-white/20"></div>
                        <button
                            onClick={() => setFilter('both')}
                            className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors", filter === 'both' ? 'bg-white text-black' : 'text-gray-400')}
                        >
                            Both
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm tracking-widest font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 animate-pulse"></span>
                        Activity_Protocol // <span className="text-white">{filter.toUpperCase()}</span>
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors focus:outline-none flex items-center gap-2 text-xs font-mono tracking-widest" title="Leaderboard">
                            <span className="material-symbols-outlined text-sm">emoji_events</span> VIEWRANK
                        </Link>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-white font-mono text-center py-20 flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                    <span className="tracking-widest animate-pulse">&gt; SYNCING_NODES [{filter.toUpperCase()}]...</span>
                </div>
            )}

            <div className="flex flex-col gap-12 w-full">
                {!loading && feedItems.length === 0 ? (
                    <div className="text-gray-500 font-mono text-center py-20 border border-dashed border-gray-800 p-8 flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl opacity-50">wifi_off</span>
                        <p>NO_ACTIVITY_DETECTED.</p>
                        <p className="text-xs">Follow more people or gain followers on GitHub.</p>
                    </div>
                ) : (
                    feedItems.map((item) => (
                        <article key={item.id} className="bg-black flex flex-col gap-4 group transition-colors relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header */}
                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border border-white flex items-center justify-center bg-white overflow-hidden">
                                        <img src={item.owner.avatar_url} alt={item.owner.login} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <Link href={`/analysis?username=${item.owner.login}`} className="font-bold text-white text-xs tracking-widest hover:underline decoration-white underline-offset-4">
                                            @{item.owner.login}
                                        </Link>
                                        <span className="text-[10px] text-gray-500 tracking-wider font-mono">
                                            pushed code {formatDistanceToNow(new Date(item.pushed_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.language && <span className="text-[10px] border border-gray-600 text-gray-400 px-1 font-mono uppercase">{item.language}</span>}
                                    <span className="material-symbols-outlined text-gray-500 text-lg cursor-pointer hover:text-white">more_horiz</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-4 p-4 border border-white/10 hover:border-white/30 transition-colors bg-white/5">
                                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                    {item.name}
                                    <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-sm text-gray-400 hover:text-white">open_in_new</span>
                                    </a>
                                </h3>

                                <p className="text-gray-300 text-sm md:text-base leading-relaxed tracking-wide font-light">
                                    {item.description || "No description provided."}
                                </p>

                                {/* Latest Stats */}
                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10 text-xs font-mono text-gray-400">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">star</span> {item.stargazers_count}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">commit</span> Latest Commit</span>
                                    </div>
                                    <Link href={`/analysis?username=${item.owner.login}`} className="text-white hover:underline decoration-white underline-offset-4 uppercase tracking-widest font-bold">
                                        &gt; Analyze Project
                                    </Link>
                                </div>
                            </div>

                            {/* Actions */}
                            {/* Actions */}
                            <div className="flex items-center gap-6 px-2">
                                <button
                                    onClick={() => handleLike(item.id)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group/btn"
                                >
                                    <span className={cn("material-symbols-outlined text-xl transition-colors", interactions[item.id]?.likedByMe ? "text-red-500 fill-current" : "group-hover/btn:text-red-500")}>
                                        {interactions[item.id]?.likedByMe ? 'favorite' : 'favorite'}
                                    </span>
                                    <span className="text-xs font-mono">{interactions[item.id]?.likes || 0}</span>
                                </button>
                                <button
                                    onClick={() => openComments(item)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">chat_bubble</span>
                                    <span className="text-xs font-mono">{interactions[item.id]?.comments || 0}</span>
                                </button>
                                {/* Removed Share Button as requested */}
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* Comments Modal (Custom implementation to avoid heavy UI lib dependency if not needed, but sticking to simple overlay) */}
            {activeCommentRepo && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActiveCommentRepo(null)}>
                    <div className="bg-black border border-white w-full max-w-lg h-[600px] flex flex-col relative" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-4 border-b border-white/20 flex justify-between items-center">
                            <h3 className="font-bold tracking-widest uppercase truncate max-w-[80%]">Comments // {activeCommentRepo.name}</h3>
                            <button onClick={() => setActiveCommentRepo(null)} className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {loadingComments ? (
                                <div className="text-center py-10 text-gray-500 font-mono animate-pulse">Loading comms...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 font-mono">No comments yet. Be the first.</div>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-3 items-start animate-in slide-in-from-bottom-2">
                                        <img src={c.user.avatar_url || "/placeholder-user.png"} className="w-8 h-8 rounded-none border border-white/30" />
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <span className="font-bold text-xs tracking-wider">@{c.user.github_username || c.user.username}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-1 leading-relaxed">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/20 bg-black">
                            <div className="flex gap-2">
                                <input
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-transparent border border-white/30 p-2 text-sm text-white focus:border-white focus:outline-none placeholder:text-gray-600 font-mono"
                                    onKeyDown={(e) => e.key === 'Enter' && postComment()}
                                />
                                <button
                                    onClick={postComment}
                                    disabled={!newComment.trim()}
                                    className="bg-white text-black px-4 font-bold tracking-widest uppercase hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
