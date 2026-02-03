"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function RightSidebar() {
    return (
        <div className="hidden lg:flex flex-col h-screen h-sticky top-0 p-4 gap-4 w-full max-w-[350px]">
            <div className="sticky top-2 z-10">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search Projects"
                        className="pl-12 bg-muted/50 border-none rounded-full focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background h-11"
                    />
                </div>
            </div>

            <div className="bg-muted/30 rounded-2xl overflow-hidden border border-border/50 mt-2">
                <h2 className="text-xl font-bold px-4 py-3">AI Insights</h2>
                <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider italic">Trending Skill</p>
                    <p className="font-bold text-base">Next.js 15 & Server Actions</p>
                    <p className="text-sm text-muted-foreground mt-0.5">3.2k projects analyzed</p>
                </div>
                <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider italic">Market Demand</p>
                    <p className="font-bold text-base">GraphQL Expert Needed</p>
                    <p className="text-sm text-muted-foreground mt-0.5">High demand in SF startups</p>
                </div>
                <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider italic">Career Path</p>
                    <p className="font-bold text-base">From Frontend to Fullstack</p>
                    <p className="text-sm text-muted-foreground mt-0.5">AI suggests adding Prisma</p>
                </div>
                <div className="px-4 py-3 text-primary hover:bg-muted/50 cursor-pointer transition-colors border-t border-border/50 text-sm">
                    Show more
                </div>
            </div>

            <div className="bg-muted/30 rounded-2xl overflow-hidden border border-border/50">
                <h2 className="text-xl font-bold px-4 py-3">Top Scorers</h2>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer transition-colors border-t border-border/50">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border shrink-0">
                            <span className="text-sm font-bold text-primary">US</span>
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden text-sm">
                            <span className="font-bold truncate">Dave Developer</span>
                            <span className="text-muted-foreground truncate">@davedev</span>
                        </div>
                        <button className="bg-foreground text-background font-bold px-4 py-1.5 rounded-full text-xs hover:opacity-90 transition-opacity">
                            Follow
                        </button>
                    </div>
                ))}
                <div className="px-4 py-3 text-primary hover:bg-muted/50 cursor-pointer transition-colors border-t border-border/50 text-sm">
                    Show more
                </div>
            </div>

            <div className="px-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="hover:underline cursor-pointer">Terms of Service</span>
                <span className="hover:underline cursor-pointer">Privacy Policy</span>
                <span className="hover:underline cursor-pointer">Cookie Policy</span>
                <span className="hover:underline cursor-pointer">Accessibility</span>
                <span className="hover:underline cursor-pointer">Ads info</span>
                <span className="hover:underline cursor-pointer">© 2026 EvalHub Corp.</span>
            </div>
        </div>
    );
}
