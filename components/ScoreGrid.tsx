"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, Zap, HelpCircle } from "lucide-react";

interface ScoreGridProps {
    scores: {
        quality: number;
        adaptation: number;
        estimate: string;
        difficulty: "Easy" | "Medium" | "Hard";
    };
}

export function ScoreGrid({ scores }: ScoreGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quality Score */}
            <Card className="p-6 relative overflow-hidden bg-card border-border/50 group hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-purple-500" />
                        <h3 className="font-bold text-lg text-purple-500">Quality Score</h3>
                    </div>
                    <span title="Based on code quality, documentation, activity, and community engagement.">
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black italic tracking-tighter">{scores.quality}</span>
                    <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                    Based on code quality, documentation, activity, community engagement, and security.
                </p>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="h-24 w-24 text-purple-500 -mr-8 -mt-8" />
                </div>
            </Card>

            {/* Adaptation Score */}
            <Card className="p-6 relative overflow-hidden bg-card border-border/50 group hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        <h3 className="font-bold text-lg text-orange-500">Adaptation Score</h3>
                    </div>
                    <span title="Based on modularity, complexity, dependencies, and compatibility.">
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black italic tracking-tighter">{scores.adaptation}</span>
                    <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                    Based on modularity, complexity, dependencies, test coverage, and compatibility.
                </p>
                <Button variant="ghost" size="sm" className="mt-4 text-orange-500 font-bold hover:bg-orange-500/10 p-0 h-auto">
                    Adapt →
                </Button>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="h-24 w-24 text-orange-500 -mr-8 -mt-8" />
                </div>
            </Card>

            {/* Implementation Estimate */}
            <Card className="p-6 relative overflow-hidden bg-card border-border/50 group hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-pink-500" />
                        <h3 className="font-bold text-lg text-pink-500">Implementation Estimate</h3>
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black italic tracking-tighter uppercase">{scores.estimate}</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <span className="text-sm text-muted-foreground">Difficulty:</span>
                    <Badge className={`rounded-full font-bold uppercase tracking-tighter text-[10px] ${scores.difficulty === "Hard" ? "bg-orange-500/10 text-orange-500 border-none" :
                        scores.difficulty === "Medium" ? "bg-blue-500/10 text-blue-500 border-none" :
                            "bg-green-500/10 text-green-500 border-none"
                        }`}>
                        {scores.difficulty}
                    </Badge>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Clock className="h-24 w-24 text-pink-500 -mr-8 -mt-8" />
                </div>
            </Card>
        </div>
    );
}

import { Button } from "@/components/ui/button";
