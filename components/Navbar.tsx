"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Github, LayoutDashboard, PlusCircle, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
    const pathname = usePathname();
    const supabase = createClient();
    const [user, setUser] = useState<SupabaseUser | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            DevShowcase
                        </span>
                    </Link>

                    {user && (
                        <nav className="hidden md:flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </div>
                            </Link>
                            <Link
                                href="/new-project"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/new-project" ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    New Analysis
                                </div>
                            </Link>
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="https://github.com/Rish3666/EvalHub"
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="h-5 w-5" />
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                                Sign Out
                            </Button>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
