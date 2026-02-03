'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TechStackRecommendation } from '@/lib/gemini'
import { toast } from 'sonner' // standard toast import

export default function LearnPage() {
    const [goal, setGoal] = useState('')
    const [preferences, setPreferences] = useState('')
    const [recommendation, setRecommendation] = useState<TechStackRecommendation | null>(null)
    const [loading, setLoading] = useState(false)

    const handleGetAdvice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!goal.trim()) return

        setLoading(true)
        setRecommendation(null)

        try {
            const res = await fetch('/api/recommend', {
                method: 'POST',
                body: JSON.stringify({ goal, preferences }),
            })

            if (res.ok) {
                const data = await res.json()
                setRecommendation(data)
            } else {
                toast.error("Failed to get recommendations.")
            }
        } catch (e) {
            console.error(e)
            toast.error("Something went wrong.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full pt-4 max-w-5xl mx-auto">
            <div className="w-full mb-8 border-b border-white/20 pb-6">
                <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight tracking-wider">
                    Tech Stack Advisor
                </h1>
                <p className="text-gray-400 text-sm mt-2 tracking-widest font-mono">&gt; AI_Module // Learning_Path_Generator</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-5">
                    <form onSubmit={handleGetAdvice} className="border border-white p-8 bg-black space-y-6 sticky top-24">
                        <div>
                            <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-400">
                                What do you want to build?
                            </label>
                            <Input
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g. A real-time chat application"
                                className="bg-white/5 border-white/30 text-white rounded-none h-12 font-mono focus:border-white transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-gray-400">
                                Any Preferences? (Optional)
                            </label>
                            <Input
                                value={preferences}
                                onChange={(e) => setPreferences(e.target.value)}
                                placeholder="e.g. Prefer Python backend, no SQL"
                                className="bg-white/5 border-white/30 text-white rounded-none h-12 font-mono focus:border-white transition-colors"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !goal.trim()}
                            className="w-full h-12 rounded-none bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-sm">settings</span>
                                    Computing Optimal Stack...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                                    Generate Learning Path
                                </span>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-7">
                    {!recommendation && !loading && (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/20 p-12 text-gray-600 font-mono text-center min-h-[400px]">
                            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">school</span>
                            <p>Enter your project idea to receive a tailored tech stack, installation commands, and learning resources.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/50 p-12 text-white font-mono min-h-[400px]">
                            <span className="material-symbols-outlined text-6xl animate-spin mb-6">memory</span>
                            <p className="animate-pulse tracking-widest">ANALYZING REQUIREMENTS...</p>
                        </div>
                    )}

                    {recommendation && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            {/* Stack Cards */}
                            <div className="border border-white bg-black p-6">
                                <h3 className="text-lg font-bold tracking-widest mb-6 border-b border-white/20 pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                    Recommended Stack
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 border border-white/10">
                                        <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Frontend</span>
                                        <span className="font-bold  tracking-wider">{recommendation.recommendedStack.frontend || "N/A"}</span>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10">
                                        <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Backend</span>
                                        <span className="font-bold tracking-wider">{recommendation.recommendedStack.backend || "N/A"}</span>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10">
                                        <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Database</span>
                                        <span className="font-bold tracking-wider">{recommendation.recommendedStack.database || "N/A"}</span>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10">
                                        <span className="text-[10px] uppercase text-gray-500 tracking-widest block mb-1">Tools</span>
                                        <div className="flex flex-wrap gap-1">
                                            {recommendation.recommendedStack.tools?.map(t => (
                                                <span key={t} className="text-xs bg-white text-black px-1.5 py-0.5 font-bold">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 text-sm text-gray-300 font-mono leading-relaxed border-t border-white/20 pt-4">
                                    <span className="text-green-400 font-bold mr-2">&gt; Analysis:</span>
                                    {recommendation.explanation}
                                </div>
                            </div>

                            {/* Install Command */}
                            <div className="border border-white bg-black p-6">
                                <h3 className="text-lg font-bold tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-400">terminal</span>
                                    Kickstart Command
                                </h3>
                                <div className="bg-[#1e1e1e] p-4 font-mono text-sm text-green-400 overflow-x-auto relative group">
                                    {recommendation.installCommands.map((cmd, i) => (
                                        <div key={i} className="mb-2 last:mb-0">$ {cmd}</div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(recommendation.installCommands.join('\n'))
                                            toast.success("Copied to clipboard")
                                        }}
                                        className="absolute right-2 top-2 p-1 bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                    </button>
                                </div>
                            </div>

                            {/* Resources */}
                            <div className="border border-white bg-black p-6">
                                <h3 className="text-lg font-bold tracking-widest mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-400">library_books</span>
                                    Learning Resources
                                </h3>
                                <div className="space-y-3">
                                    {recommendation.resources.map((res, i) => (
                                        <a key={i} href={res.url} target="_blank" rel="noreferrer" className="block p-4 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-colors group">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold tracking-wide group-hover:underline decoration-2 underline-offset-4">{res.title}</span>
                                                <span className="text-[10px] uppercase border border-white/40 px-1 group-hover:border-black/40">{res.type}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 font-mono group-hover:text-black/60 truncate">{res.url}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
