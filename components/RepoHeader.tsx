"use client";

import { Github, Star, GitFork, Eye, AlertCircle, Share2, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface RepoHeaderProps {
    name: string;
    description: string;
    stats: {
        stars: number;
        forks: number;
        watchers: number;
        issues: number;
    };
    htmlUrl: string;
}

export function RepoHeader({ name, description, stats, htmlUrl }: RepoHeaderProps) {
    const { toast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard.`,
        });
    };

    return (
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex gap-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                        <Github className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none truncate max-w-[300px] sm:max-w-md lg:max-w-xl">
                            {name}
                        </h1>
                        <p className="text-muted-foreground line-clamp-2 max-w-2xl">
                            {description || "No description provided."}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-sm font-bold">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
                                <span>{stats.stars.toLocaleString()}</span>
                                <span className="text-muted-foreground font-normal">Stars</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-bold">
                                <GitFork className="h-4 w-4 text-blue-500" />
                                <span>{stats.forks.toLocaleString()}</span>
                                <span className="text-muted-foreground font-normal">Forks</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-bold">
                                <Eye className="h-4 w-4 text-green-500" />
                                <span>{stats.watchers.toLocaleString()}</span>
                                <span className="text-muted-foreground font-normal">Watchers</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-bold">
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                <span>{stats.issues.toLocaleString()}</span>
                                <span className="text-muted-foreground font-normal">Issues</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-full font-bold h-10 px-4" onClick={() => copyToClipboard(window.location.href, "Analysis URL")}>
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full font-bold h-10 px-4" asChild>
                        <a href={htmlUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                <Button variant="secondary" className="rounded-xl font-bold border border-border/50 h-12 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <GitFork className="mr-2 h-4 w-4" /> Fork Repository
                </Button>
                <Button variant="secondary" className="rounded-xl font-bold border border-border/50 h-12 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400" onClick={() => copyToClipboard(`git clone ${htmlUrl}.git`, "Clone command")}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Git Command
                </Button>
                <Button variant="secondary" className="rounded-xl font-bold border border-border/50 h-12 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400" asChild>
                    <a href={`${htmlUrl}/archive/refs/heads/main.zip`}>
                        <ExternalLink className="mr-2 h-4 w-4" /> Download ZIP
                    </a>
                </Button>
                <Button variant="secondary" className="rounded-xl font-bold border border-border/50 h-12 bg-muted/30 hover:bg-muted/50" onClick={() => copyToClipboard(htmlUrl, "Repo URL")}>
                    <Copy className="mr-2 h-4 w-4" /> Copy URL
                </Button>
                <Button variant="secondary" className="rounded-xl font-bold border border-border/50 h-12 bg-pink-500/5 hover:bg-pink-500/10 text-pink-600 dark:text-pink-400" asChild>
                    <a href={`https://github.dev/${htmlUrl.replace("https://github.com/", "")}`} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-4 w-4" /> GitHub.dev
                    </a>
                </Button>
            </div>
        </div>
    );
}
