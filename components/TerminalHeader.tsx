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

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

    return (
        <header className="w-full border-b border-white bg-black px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-50 gap-4">
            <Link href="/feed" className="flex items-center gap-2 md:gap-4 shrink-0 hover:opacity-80 transition-opacity">
                <img src="/logo.jpg" alt="EvalHub" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/20" />
                <h2 className="text-white text-lg md:text-xl font-bold tracking-widest uppercase font-mono">EVALHUB_</h2>
            </Link>

            <div className="hidden md:block flex-1 max-w-2xl px-8">
                <div className="relative w-full" ref={searchRef}>
                    <input
                        className="w-full bg-black border border-white text-white px-4 py-2 font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-white rounded-none tracking-widest shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] focus:shadow-none transition-shadow"
                        placeholder="SEARCH PROJECTS OR USERS..."
                        type="text"
                        value={query}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                        onFocus={() => {
                            if (results.length > 0) setShowResults(true)
                        }}
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
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
                            {results.map((result: any) => (
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

            <nav className="hidden md:flex items-center gap-4 lg:gap-8 shrink-0">
                <Link
                    href="/feed"
                    className={cn(
                        "text-xs lg:text-sm font-bold px-4 lg:px-6 py-2 rounded-full uppercase tracking-widest transition-colors font-mono",
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
                        "text-xs lg:text-sm font-bold uppercase tracking-widest transition-colors font-mono",
                        isActive('/community')
                            ? "text-black bg-white border border-white px-4 lg:px-6 py-2 rounded-full hover:bg-gray-200"
                            : "text-white font-medium hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    COMMUNITY
                </Link>
                <Link
                    href="/inbox"
                    className={cn(
                        "text-xs lg:text-sm font-bold uppercase tracking-widest transition-colors font-mono",
                        isActive('/inbox')
                            ? "text-black bg-white border border-white px-4 lg:px-6 py-2 rounded-full hover:bg-gray-200"
                            : "text-white font-medium hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    INBOX
                </Link>
                <Link
                    href="/profile"
                    className={cn(
                        "text-xs lg:text-sm font-bold uppercase tracking-widest transition-colors font-mono",
                        isActive('/profile')
                            ? "text-black bg-white border border-white px-4 lg:px-6 py-2 rounded-full hover:bg-gray-200"
                            : "text-white font-medium hover:underline decoration-2 underline-offset-4 text-gray-400 hover:text-white"
                    )}
                >
                    PROFILE
                </Link>
            </nav>

            <div className="md:hidden flex items-center gap-4">
                <button
                    onClick={() => {
                        setIsMenuOpen(false)
                        setIsSearchOpen(!isSearchOpen)
                    }}
                    className="text-white hover:opacity-80 transition-opacity"
                >
                    <Search className="w-6 h-6" />
                </button>
                <button
                    onClick={() => {
                        setIsSearchOpen(false)
                        toggleMenu()
                    }}
                    className="text-white hover:opacity-80 transition-opacity"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] bg-black md:hidden animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col h-full border-2 border-white m-4">
                        <div className="flex items-center gap-4 p-4 border-b border-white">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input
                                autoFocus
                                className="flex-1 bg-black text-white py-2 font-mono text-sm placeholder-gray-500 focus:outline-none uppercase tracking-widest"
                                placeholder="SEARCH..."
                                type="text"
                                value={query}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (event.key === 'Enter' && query.trim()) {
                                        event.preventDefault()
                                        setIsSearchOpen(false)
                                        router.push(`/profile/${encodeURIComponent(query.trim())}`)
                                    }
                                }}
                            />
                            <button onClick={() => setIsSearchOpen(false)} className="text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isSearching && (
                                <div className="px-6 py-8 text-center text-gray-400 font-mono tracking-widest text-xs">
                                    SEARCHING_GITHUB...
                                </div>
                            )}
                            {!isSearching && results.length > 0 && (
                                <div className="p-2">
                                    {results.map((result: any) => (
                                        <button
                                            key={result.id}
                                            className="w-full text-left px-4 py-4 flex items-center justify-between gap-3 hover:bg-white hover:text-black transition-colors border-b border-white/5"
                                            type="button"
                                            onClick={() => {
                                                setIsSearchOpen(false)
                                                handleNavigate(result.username)
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <img src={result.avatar_url || ''} alt={result.username} className="h-10 w-10 rounded-none border border-white/20" />
                                                <div>
                                                    <div className="text-sm font-bold uppercase tracking-tight">{result.full_name || result.username}</div>
                                                    <div className="text-[10px] text-gray-500">@{result.username}</div>
                                                </div>
                                            </div>
                                            <UserPlus className="h-4 w-4 opacity-70" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!isSearching && query.trim().length >= 2 && results.length === 0 && (
                                <div className="px-6 py-12 text-center text-gray-500 font-mono text-xs">
                                    NO_RESULTS_FOUND.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] bg-black md:hidden animate-in fade-in duration-300">
                    <div className="flex flex-col h-full border-2 border-white m-4">
                        <div className="flex items-center justify-between p-6 border-b border-white">
                            <h2 className="text-white text-xl font-bold tracking-widest uppercase font-mono">MENU_</h2>
                            <button onClick={toggleMenu} className="text-white">
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                        </div>
                        <nav className="flex flex-col flex-1 p-6 gap-6">
                            <Link
                                href="/feed"
                                onClick={toggleMenu}
                                className={cn(
                                    "text-2xl font-bold uppercase tracking-[0.2em] font-mono p-4 border border-transparent transition-all",
                                    isActive('/feed') || pathname === '/feed' ? "border-white bg-white text-black" : "text-white hover:border-white/20"
                                )}
                            >
                                / HOME
                            </Link>
                            <Link
                                href="/community"
                                onClick={toggleMenu}
                                className={cn(
                                    "text-2xl font-bold uppercase tracking-[0.2em] font-mono p-4 border border-transparent transition-all",
                                    isActive('/community') ? "border-white bg-white text-black" : "text-white hover:border-white/20"
                                )}
                            >
                                / COMMUNITY
                            </Link>
                            <Link
                                href="/inbox"
                                onClick={toggleMenu}
                                className={cn(
                                    "text-2xl font-bold uppercase tracking-[0.2em] font-mono p-4 border border-transparent transition-all",
                                    isActive('/inbox') ? "border-white bg-white text-black" : "text-white hover:border-white/20"
                                )}
                            >
                                / INBOX
                            </Link>
                            <Link
                                href="/profile"
                                onClick={toggleMenu}
                                className={cn(
                                    "text-2xl font-bold uppercase tracking-[0.2em] font-mono p-4 border border-transparent transition-all",
                                    isActive('/profile') ? "border-white bg-white text-black" : "text-white hover:border-white/20"
                                )}
                            >
                                / PROFILE
                            </Link>
                        </nav>
                        <div className="p-6 border-t border-white text-center">
                            <p className="text-[10px] text-gray-500 tracking-[0.4em] uppercase font-mono">EVALHUB v1.0.0 // PROTOCOL_READY</p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
