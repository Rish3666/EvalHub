'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface Community {
    id: string; // Changed to string for UUID
    name: string;
    description: string;
    tags: string;
    created_at: string;
}

export default function CommunityPage() {
    const [friends, setFriends] = useState<any[]>([])
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [isLoadingFriends, setIsLoadingFriends] = useState(true)
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
    const [groups, setGroups] = useState<Community[]>([]) // Added groups state
    const [isLoading, setIsLoading] = useState(true) // Added isLoading for communities
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDesc, setNewGroupDesc] = useState('')
    const [newGroupTags, setNewGroupTags] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const supabase = createClient() // Added supabase client
    const router = useRouter()

    useEffect(() => {
        fetchCommunities()
        fetchFriends()
        fetchGitHubSuggestions()
    }, [])

    async function fetchFriends() {
        setIsLoadingFriends(true)
        try {
            const res = await fetch('/api/friends/list')
            if (res.ok) {
                const data = await res.json()
                setFriends(data)
            }
        } catch (error) {
            console.error("Failed to fetch friends", error)
        } finally {
            setIsLoadingFriends(false)
        }
    }

    async function fetchGitHubSuggestions() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
            try {
                const res = await fetch('https://api.github.com/user/following?per_page=5', {
                    headers: { Authorization: `Bearer ${session.provider_token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setSuggestions(data)
                }
            } catch (error) {
                console.error("Failed to fetch suggestions", error)
            } finally {
                setIsLoadingSuggestions(false)
            }
        } else {
            setIsLoadingSuggestions(false)
        }
    }

    async function fetchCommunities() {
        try {
            const res = await fetch('/api/communities')
            if (res.ok) {
                const data = await res.json()
                setGroups(data)
            }
        } catch (error) {
            console.error("Failed to fetch communities", error)
        } finally {
            setIsLoading(false)
        }
    }


    const handleJoin = async (communityId: string) => {
        try {
            const res = await fetch(`/api/communities/${communityId}/join`, { method: 'POST' })
            if (res.ok) {
                toast.success(`Joined community successfully`)
                router.push(`/community/${communityId}`)
            } else {
                const err = await res.json()
                toast.error(`Failed to join: ${err.error}`)
            }
        } catch (error) {
            toast.error("Network error joining community")
        }
    }

    const handlePing = async (friend: any) => {
        try {
            // 1. Find user in DB
            const { data: dbUser, error: dbError } = await supabase
                .from('users')
                .select('id')
                .eq('github_username', friend.login)
                .single()

            if (dbError || !dbUser) {
                toast.error(`${friend.login} hasn't joined EvalHub yet.`)
                return
            }

            // 2. Send request
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: dbUser.id })
            })

            if (res.ok) {
                toast.success(`Friend request sent to ${friend.login}!`)
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to send request.")
            }
        } catch (error) {
            toast.error("Error pinging node.")
        }
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const res = await fetch('/api/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDesc,
                    tags: newGroupTags
                })
            })

            if (res.ok) {
                toast.success('Community created successfully!')
                setNewGroupName('')
                setNewGroupDesc('')
                setNewGroupTags('')
                fetchCommunities()
            } else {
                toast.error('Failed to create community')
            }
        } catch (error) {
            toast.error('Network error creating community')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="w-full pt-4">
            <div className="w-full mb-8 flex flex-col md:flex-row items-end justify-between gap-4">
                {/* ... existing header ... */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full flex-1">
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">person</span>
                            <h3 className="text-sm font-bold tracking-widest">Active_Friends</h3>
                        </div>
                        <div className="text-[10px] text-gray-400 animate-pulse tracking-widest">Sync_Online</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoadingFriends ? (
                            <div className="col-span-3 text-center py-10 text-gray-500 font-mono animate-pulse">Syncing nodes...</div>
                        ) : friends.length === 0 ? (
                            <div className="col-span-3 text-center py-10 text-gray-500 font-mono border border-dashed border-gray-800">
                                NO_ACTIVE_CONNECTIONS
                                <p className="text-[10px] mt-2 opacity-50">Ping users in your network to start chatting.</p>
                            </div>
                        ) : (
                            friends.map((friend) => (
                                <div key={friend.id} className="border border-white p-6 bg-black flex flex-col justify-between h-full hover:border-gray-400 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 border border-white flex items-center justify-center font-bold text-xl overflow-hidden bg-white">
                                            <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="material-symbols-outlined text-green-500 text-sm animate-pulse">fiber_manual_record</span>
                                    </div>
                                    <div className="mb-6">
                                        <h4 className="text-lg font-bold tracking-wider truncate">@{friend.username}</h4>
                                        <p className="text-xs text-gray-400 mt-1 tracking-widest truncate">
                                            {friend.full_name || "Active Member"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/inbox`)}
                                        className="w-full bg-white text-black py-2 text-xs font-bold tracking-widest hover:bg-gray-300 transition-colors uppercase"
                                    >
                                        Message_
                                    </button>
                                </div>
                            ))
                        )}
                    </div>


                    {/* Discover / GitHub Network Section */}
                    <div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">public</span>
                            <h3 className="text-sm font-bold tracking-widest uppercase">Discover_Network</h3>
                        </div>
                        <div className="text-[10px] text-gray-400 tracking-widest">GH_FOLLOWING</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoadingSuggestions ? (
                            <div className="col-span-3 text-center py-10 text-gray-500 font-mono animate-pulse">Scanning GH...</div>
                        ) : suggestions.length === 0 ? (
                            <div className="col-span-3 text-center py-10 text-gray-500 font-mono">No network suggestions available.</div>
                        ) : (
                            suggestions.map((friend) => (
                                <div key={friend.id} className="border border-white/20 p-6 bg-black/40 flex flex-col justify-between h-full hover:border-white transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-10 w-10 border border-white/30 flex items-center justify-center overflow-hidden bg-white/10">
                                            <img src={friend.avatar_url} alt={friend.login} className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <h4 className="text-base font-bold tracking-wider truncate">@{friend.login}</h4>
                                        <span className="text-[8px] text-gray-500 font-mono uppercase">NOT_IN_CORE</span>
                                    </div>
                                    <button
                                        onClick={() => handlePing(friend)}
                                        className="w-full border border-white/30 text-white/50 py-2 text-[10px] font-bold tracking-widest hover:border-white hover:text-white transition-colors uppercase"
                                    >
                                        Ping_
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* ... existing Groups section ... */}
                    <div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">groups</span>
                            <h3 className="text-sm font-bold tracking-widest uppercase">Groups</h3>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="text-[10px] text-white border border-white px-2 py-0.5 hover:bg-white hover:text-black transition-colors font-bold tracking-tighter">
                                    Initialize_
                                </button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border border-white text-white font-mono p-8 rounded-none max-w-md">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-xl font-bold tracking-widest border-b border-white/20 pb-2 uppercase text-white">Create_New_Network</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateGroup} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-widest">Node_Name</label>
                                        <Input
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="e.g., Rust_Explorers"
                                            className="bg-black border-white rounded-none text-white focus-visible:ring-0 focus-visible:border-white transition-all placeholder:text-gray-700 w-full"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-widest">Protocols (Tags)</label>
                                        <Input
                                            value={newGroupTags}
                                            onChange={(e) => setNewGroupTags(e.target.value)}
                                            placeholder="e.g., Rust, WASM, Low-Level"
                                            className="bg-black border-white rounded-none text-white focus-visible:ring-0 focus-visible:border-white transition-all placeholder:text-gray-700 w-full"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-widest">Entry_Log (Description)</label>
                                        <Textarea
                                            value={newGroupDesc}
                                            onChange={(e) => setNewGroupDesc(e.target.value)}
                                            placeholder="What is this community about?"
                                            className="bg-black border-white rounded-none text-white focus-visible:ring-0 focus-visible:border-white transition-all placeholder:text-gray-700 min-h-[100px] w-full"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full bg-white text-black rounded-none font-bold tracking-widest hover:bg-gray-300 transition-colors py-6 uppercase"
                                    >
                                        {isCreating ? 'Deploying...' : 'Establish_Node'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            <div className="text-xs text-gray-500 font-mono animate-pulse">Loading Communities...</div>
                        ) : groups.length === 0 ? (
                            <div className="text-xs text-gray-500 font-mono border border-dashed border-gray-800 p-6 text-center">
                                NO_COMMUNITIES_INITIALIZED
                                <p className="text-[10px] mt-2 opacity-50 italic">Start a new node to begin networking.</p>
                            </div>
                        ) : (
                            groups.map((group) => (
                                <div key={group.id} className="border border-white p-5 hover:bg-white/5 transition-all group flex flex-col gap-4 bg-black">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-bold tracking-widest">{group.name}</h4>
                                        <span className="text-[10px] text-gray-400 border border-gray-600 px-1 py-0.5">{group.tags}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono leading-relaxed">{group.description}</p>
                                    <button
                                        onClick={() => handleJoin(group.id)}
                                        className="w-full border border-white text-white py-2 text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
                                    >
                                        Join_ <span className="material-symbols-outlined text-[14px]">login</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>


        </div>
    )
}
