"use client";

import { AlertTriangle, GitPullRequest, Code2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Dependency {
    name: string;
    type: "production" | "development";
    version?: string;
}

interface ConcernsSidebarProps {
    concerns: string[];
    pullRequests?: any[];
    dependencies: Dependency[];
}

export function ConcernsSidebar({ concerns, pullRequests = [], dependencies }: ConcernsSidebarProps) {
    return (
        <div className="space-y-6">
            {/* Implementation Concerns */}
            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-bold text-lg">Implementation Concerns</h3>
                </div>
                {concerns.length > 0 ? (
                    <div className="space-y-3">
                        {concerns.map((concern, idx) => (
                            <div key={idx} className="flex gap-3">
                                <AlertTriangle className="h-4 w-4 text-orange-500/50 shrink-0 mt-1" />
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {concern}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No immediate concerns identified.</p>
                )}
            </div>

            {/* Pull Requests */}
            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 space-y-4">
                <div className="flex items-center gap-2">
                    <GitPullRequest className="h-5 w-5 text-blue-500" />
                    <h3 className="font-bold text-lg">Pull Requests</h3>
                </div>
                {pullRequests.length > 0 ? (
                    <div className="space-y-3">
                        {/* Placeholder for PRs if we implement them later */}
                    </div>
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-sm text-muted-foreground">No pull request data available</p>
                    </div>
                )}
            </div>

            {/* Key Dependencies */}
            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 space-y-4">
                <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Key Dependencies</h3>
                </div>
                <div className="space-y-4">
                    {dependencies.map((dep, idx) => (
                        <div key={idx} className="flex items-center justify-between group cursor-pointer">
                            <div className="space-y-0.5">
                                <p className="font-bold text-sm text-primary hover:underline">{dep.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{dep.type}</p>
                            </div>
                            {dep.version && (
                                <Badge variant="secondary" className="rounded-md text-[10px] h-5 bg-muted border-none opacity-60 group-hover:opacity-100 transition-opacity">
                                    ^{dep.version}
                                </Badge>
                            )}
                        </div>
                    ))}
                    <div className="pt-2">
                        <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Show all dependencies →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
