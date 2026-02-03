'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function CompanyMatchPage() {
    const { id } = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [company, setCompany] = useState<any>(null)
    const [match, setMatch] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [matching, setMatching] = useState(false)

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: companyData } = await supabase
                .from('companies')
                .select('*')
                .eq('id', id)
                .single()

            setCompany(companyData)

            const { data: matchData } = await supabase
                .from('company_matches')
                .select('*')
                .eq('company_id', id)
                .maybeSingle()

            setMatch(matchData)
        } catch (error) {
            console.error("Error fetching data", error)
        } finally {
            setLoading(false)
        }
    }

    async function runMatch() {
        setMatching(true)
        try {
            const res = await fetch('/api/companies/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: id })
            })

            if (res.ok) {
                const data = await res.json()
                setMatch(data.match)
                toast.success("Compatibility analysis complete!")
            } else {
                toast.error("Failed to run match simulation.")
            }
        } catch (error) {
            toast.error("Network error during match.")
        } finally {
            setMatching(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black text-white font-mono">
            <div className="animate-pulse">SCANNING_TARGET_NODE...</div>
        </div>
    )

    if (!company) return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white font-mono p-4 text-center">
            <h1 className="text-xl mb-4 text-red-500">ERROR: NODE_NOT_FOUND</h1>
            <button onClick={() => router.back()} className="border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors">RETURN_</button>
        </div>
    )

    return (
        <div className="w-full pt-4 min-h-screen bg-black text-white font-mono p-6">
            <div className="max-w-4xl mx-auto border border-white p-8 space-y-8 relative overflow-hidden">
                {/* CRT Scanline Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20"></div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start border-b border-white/30 pb-6 gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 border border-white flex items-center justify-center bg-white overflow-hidden">
                            <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tighter uppercase">{company.name}</h1>
                            <p className="text-xs text-blue-400 tracking-widest uppercase mt-1">Status: Verified_Target</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Protocol: COMPATIBILITY_V4.2</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Hash: {id.toString().slice(0, 8)}...</div>
                    </div>
                </div>

                {/* Compatibility Core */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-8 relative z-10">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-4">_Analysis_Kernel</h3>
                            <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                                {/* Rotating borders */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 border border-blue-500/30 rounded-full"
                                />

                                <div className="text-center">
                                    <div className="text-5xl font-bold tracking-tighter">
                                        {match ? `${match.compatibility_score}%` : '--%'}
                                    </div>
                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Core_Alignment</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!match ? (
                                <button
                                    onClick={runMatch}
                                    disabled={matching}
                                    className="w-full bg-white text-black py-4 font-bold tracking-[0.3em] hover:bg-gray-200 transition-colors uppercase disabled:bg-gray-700 disabled:text-gray-500"
                                >
                                    {matching ? 'SIMULATING_MATCH...' : 'RUN_MATCH_SIMULATION'}
                                </button>
                            ) : (
                                <button
                                    onClick={runMatch}
                                    disabled={matching}
                                    className="w-full border border-white text-white py-4 font-bold tracking-[0.3em] hover:bg-white hover:text-black transition-colors uppercase"
                                >
                                    {matching ? 'RE_SIMULATING...' : 'FORCE_RE_SYNC'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-1">_Target_Requirements</h3>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                                {company.tech_stack?.map((tech: string) => (
                                    <span key={tech} className="bg-white/5 border border-white/20 px-2 py-1 uppercase">{tech}</span>
                                ))}
                            </div>
                        </div>

                        {match && (
                            <>
                                <div>
                                    <h3 className="text-xs text-green-500 uppercase tracking-widest mb-4 border-b border-green-500/20 pb-1">_Synched_Modules</h3>
                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                        {match.match_details?.matchedSkills?.map((tech: string) => (
                                            <span key={tech} className="bg-green-500/10 border border-green-500/50 text-green-500 px-2 py-1 uppercase">{tech}</span>
                                        ))}
                                        {match.match_details?.matchedSkills?.length === 0 && (
                                            <span className="text-gray-600 italic uppercase">No directly synched modules found</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs text-red-500 uppercase tracking-widest mb-4 border-b border-red-500/20 pb-1">_Missing_Protocols</h3>
                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                        {match.match_details?.missingSkills?.map((tech: string) => (
                                            <span key={tech} className="bg-red-500/10 border border-red-500/50 text-red-500 px-2 py-1 uppercase">{tech}</span>
                                        ))}
                                        {match.match_details?.missingSkills?.length === 0 && (
                                            <span className="text-green-500 italic uppercase">System alignment 100% complete</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="border-t border-dashed border-white/20 pt-6 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest relative z-10">
                    <div className="flex gap-4">
                        <span>CPU: OK</span>
                        <span>NET: ESTABLISHED</span>
                        <span>MEM: 128KB FREE</span>
                    </div>
                    <button onClick={() => router.back()} className="hover:text-white transition-colors underline cursor-pointer">Terminate_Session</button>
                </div>
            </div>
        </div>
    )
}
