'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Terminal, Search, Menu, UserPlus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function TerminalHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Array<{
        id: string
        username: string
        full_name: string | null
        avatar_url: string | null
    }>>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/feed'
        return pathname?.startsWith(path)
    }

    useEffect(() => {
        const timer = setTimeout(async () => {
            const trimmed = query.trim()
            if (trimmed.length < 2) {
                setResults([])
                setShowResults(false)
                return
            }

            setIsSearching(true)

            try {
                // Fetch valid session for querying GitHub
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.provider_token

                const headers: HeadersInit = {
                    "Accept": "application/vnd.github.v3+json"
                }
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`
                }

                // Search GitHub Users API
                const res = await fetch(`https://api.github.com/search/users?q=${trimmed}&per_page=5`, { headers })

                if (res.ok) {
                    const data = await res.json()
                    const mappedResults = data.items.map((item: any) => ({
                        id: String(item.id),
                        username: item.login,
                        full_name: null, // GitHub search summary doesn't always have full name, logic usually needs detail fetch but username is enough for initial
                        avatar_url: item.avatar_url
                    }))
                    setResults(mappedResults)
                    setShowResults(true)
                } else {
                    setResults([])
                }
            } catch (error) {
                console.error('Search error:', error)
                setResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, supabase])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNavigate = (username: string) => {
        setShowResults(false)
        setQuery('')
        router.push(`/profile/${username}`)
    }

    return (
        <header className="w-full border-b border-white bg-black px-6 py-4 flex items-center justify-between sticky top-0 z-50 gap-4">
            <Link href="/feed" className="flex items-center gap-4 shrink-0 hover:opacity-80 transition-opacity">
                <img src="/logo.jpg" alt="EvalHub" className="w-10 h-10 rounded-full border border-white/20" />
                <h2 className="text-white text-xl font-bold tracking-widest uppercase font-mono">EVALHUB_</h2>
            </Link>

            <div className="hidden md:block flex-1 max-w-2xl px-8">
                <div className="relative w-full" ref={searchRef}>
                    <input
                        className="w-full bg-black border border-white text-white px-4 py-2 font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-white rounded-none tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] focus:shadow-none transition-shadow"
                        placeholder="SEARCH PROJECTS OR USERS..."
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => {
                            if (results.length > 0) setShowResults(true)
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && query.trim()) {
                                event.preventDefault()
                                setShowResults(false)
                                router.push(`/profile/${encodeURIComponent(query.trim())}`)
                            }
                        }}
                    />
                    <Search className="absolute right-3 top-2 text-gray-500 w-4 h-4" />

                    {showResults && (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] border border-white bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] z-50">
                            <div className="px-4 py-2 text-xs font-mono text-gray-400 border-b border-white/20 tracking-widest uppercase">
                                {isSearching ? 'Searching GitHub...' : 'GitHub Users'}
                            </div>
                            {results.length === 0 && !isSearching && (
                                <div className="px-4 py-3 text-sm text-gray-400 font-mono">
                                    No profiles found. Try a different name.
                                </div>
                            )}
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-white hover:text-black transition-colors"
                                    type="button"
                                    onClick={() => handleNavigate(result.username)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full border border-white/40 overflow-hidden bg-white/10 flex items-center justify-center">
                                            {result.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={result.avatar_url} alt={result.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold">{result.username[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold">{result.full_name || result.username}</div>
                                            <div className="text-xs text-gray-400">@{result.username}</div>
                                        </div>
                                    </div>
                                    <UserPlus className="h-4 w-4 opacity-70" />
                                </button>
                            ))}
                            {query.trim().length >= 2 && !isSearching && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResults(false)
                                        router.push(`/profile/${encodeURIComponent(query.trim())}`)
                                    }}
                                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 border-t border-white/20 hover:bg-white hover:text-black transition-colors"
                                >
                                    <span className="text-sm font-mono tracking-widest">VIEW_PROFILE</span>
                                    <span className="text-xs text-gray-400">@{query.trim()}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 shrink-0">
                <Link
                    href="/feed"
                    className={cn(
                        "text-sm font-bold px-6 py-2 rounded-full uppercase tracking-widest transition-colors font-mono",
                        isActive('/feed') || pathname === '/feed'
                            ? "text-black bg-white border border-white hover:bg-gray-200"
                            : "text-white hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    HOME
                </Link>
                <Link
                    href="/community"
                    className={cn(
                        "text-sm font-bold uppercase tracking-widest transition-colors font-mono",
                        isActive('/community')
                            ? "text-black bg-white border border-white px-6 py-2 rounded-full hover:bg-gray-200"
                            : "text-white font-medium hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    COMMUNITY
                </Link>
                <Link
                    href="/inbox"
                    className={cn(
                        "text-sm font-bold uppercase tracking-widest transition-colors font-mono",
                        isActive('/inbox')
                            ? "text-black bg-white border border-white px-6 py-2 rounded-full hover:bg-gray-200"
                            : "text-white font-medium hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    INBOX
                </Link>
                <Link
                    href="/profile"
                    className={cn(
                        "text-sm font-bold uppercase tracking-widest transition-colors font-mono",
                        isActive('/profile')
                            ? "text-black bg-white border border-white px-6 py-2 rounded-full hover:bg-gray-200"
                            : "text-white font-medium hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    PROFILE
                </Link>
            </nav>

            <div className="md:hidden">
                <Menu className="text-white w-6 h-6" />
            </div>
        </header>
    )
}
