import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Sparkles, Target, Share2, Image as ImageIcon, List, Smile, Calendar, MapPin } from "lucide-react";

export default function HomePage() {
    return (
        <div className="flex flex-col">
            {/* Page Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/50">
                <h1 className="text-xl font-bold">Home</h1>
            </div>

            {/* "Post" / Start Analysis Section */}
            <div className="p-4 border-b border-border/50 flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border shrink-0 mt-1">
                    <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                    <Link href="/new-project" className="block">
                        <div className="text-xl text-muted-foreground py-2 cursor-pointer hover:text-foreground transition-colors">
                            What&apos;s your next project? Start an analysis...
                        </div>
                    </Link>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex gap-1 text-primary">
                            <div className="p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors"><ImageIcon className="h-5 w-5" /></div>
                            <div className="p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors"><List className="h-5 w-5" /></div>
                            <div className="p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors"><Smile className="h-5 w-5" /></div>
                            <div className="p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors"><Calendar className="h-5 w-5" /></div>
                            <div className="p-2 hover:bg-primary/10 rounded-full cursor-pointer transition-colors opacity-50 cursor-not-allowed"><MapPin className="h-5 w-5" /></div>
                        </div>
                        <Button size="sm" className="font-bold px-4" asChild>
                            <Link href="/new-project">Analyze</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Featured Section (Hero-like but feed-style) */}
            <div className="divide-y divide-border/50">
                <div className="p-4 hover:bg-muted/10 transition-colors cursor-pointer group">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border shrink-0">
                            <Target className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <span className="font-bold">EvalHub</span>
                                <span className="text-muted-foreground text-sm">@evalhub · Just now</span>
                            </div>
                            <p className="text-base text-foreground leading-normal">
                                Welcome to the new EvalHub. Stop telling recruiters what you can do. Start showing them with AI-verified skill scorecards. 🚀
                            </p>
                            <div className="mt-3 border rounded-2xl overflow-hidden bg-muted/20 hover:bg-muted/30 transition-colors">
                                <div className="p-6 space-y-4">
                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">AI Deep Dive Assessment</h3>
                                    <p className="text-muted-foreground leading-tight">Our AI analyzes your real code and README to understand the technical depth of your work.</p>
                                    <Button variant="outline" className="rounded-full font-bold group-hover:bg-background">Try it out</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 hover:bg-muted/10 transition-colors cursor-pointer">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border shrink-0">
                            <Share2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <span className="font-bold">Verified Proof</span>
                                <span className="text-muted-foreground text-sm">@proof · 2h</span>
                            </div>
                            <p className="text-base text-foreground leading-normal">
                                Every analysis generates a unique, shareable URL with dynamic OG images. Perfect for your LinkedIn or Twitter bio.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View on GitHub Button at bottom of feed */}
            <div className="p-8 text-center bg-muted/5">
                <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
                    <Link href="https://github.com/Rish3666/EvalHub" target="_blank">
                        <Github className="mr-2 h-5 w-5" /> View Project on GitHub
                    </Link>
                </Button>
            </div>
        </div>
    );
}
