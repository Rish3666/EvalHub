'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Spline from '@splinetool/react-spline'
import { Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
    const supabase = createClient()

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        })
    }

    return (
        <div className="bg-black text-white font-sans overflow-hidden min-h-screen relative flex flex-col items-center justify-center">

            {/* Spline Background - Full Screen for seamless integration */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <Spline
                    className="w-full h-full scale-110" // Slight scale to ensure coverage and center focus
                    scene="https://prod.spline.design/ZzB10jpkMgJmsUX7/scene.splinecode"
                />
            </div>

            {/* Content Overlay */}
            <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-2"
                >
                    <h1 className="font-display text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white uppercase selection:bg-white selection:text-black drop-shadow-2xl">
                        EVALHUB
                    </h1>
                    <p className="text-lg md:text-xl font-light tracking-widest text-white/80 max-w-2xl mx-auto uppercase selection:bg-white selection:text-black drop-shadow-md">
                        The Proof-of-Work Layer for Developers.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col items-center gap-6 w-full max-w-xs"
                >
                    <Button
                        onClick={handleLogin}
                        className="flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 px-6 py-6 w-full font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] cursor-pointer"
                    >
                        <Github className="w-5 h-5" />
                        LOGIN WITH GITHUB
                    </Button>

                    <div className="flex flex-col items-center space-y-2">
                        <p className="text-white/60 text-xs tracking-widest uppercase font-mono">
                            System Status: <span className="text-green-400 animate-pulse">ONLINE</span>
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* Footer / Status Bar from design */}
            <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between items-center z-10 pointer-events-none">
                <div className="hidden md:block text-white/80">
                    <span className="text-[9px] uppercase tracking-[0.6em] bg-black/50 px-2 py-1 backdrop-blur-sm">Protocol v1.0.0</span>
                </div>
                <div className="flex space-x-8 pointer-events-auto">
                    <a className="text-[9px] uppercase tracking-[0.6em] text-white/40 hover:text-white transition-colors" href="#">Docs</a>
                    <a className="text-[9px] uppercase tracking-[0.6em] text-white/40 hover:text-white transition-colors" href="#">Legal</a>
                </div>
            </div>
        </div>
    )
}
