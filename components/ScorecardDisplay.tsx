'use client';

import { useState } from 'react';
import { RepoHeader } from './RepoHeader';
import { ScoreGrid } from './ScoreGrid';
import { ConcernsSidebar } from './ConcernsSidebar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    LayoutDashboard,
    ShieldCheck,
    Zap,
    FileText,
    MessageSquare,
    Code2,
    Users,
    Search,
    Wrench,
    Sparkles
} from 'lucide-react';

interface ScorecardProps {
    scorecard: {
        overall_score: number;
        ai_analysis: {
            complexity: string;
            strengths: string[];
            techAreas: string[];
            architectureNotes: string;
            qualityScore: number;
            adaptationScore: number;
            implementationEstimate: string;
            difficulty: "Easy" | "Medium" | "Hard";
            concerns: string[];
            repoMetadata?: any;
            languages?: Record<string, number>;
        };
        skill_breakdown: Record<string, any>;
        technologies_known: any[];
        share_token: string;
        views_count: number;
    };
    project: {
        title: string;
        description: string;
        author: { full_name: string };
    };
}

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'quality', label: 'Quality', icon: ShieldCheck },
    { id: 'adaptation', label: 'Adaptation', icon: Zap },
    { id: 'readme', label: 'Readme', icon: FileText },
    { id: 'reddit', label: 'Reddit', icon: MessageSquare },
    { id: 'tech-talk', label: 'Tech Talk', icon: Code2 },
    { id: 'github', label: 'GitHub Discussion', icon: Users },
    { id: 'similar', label: 'Similar', icon: Search },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'assistant', label: 'Assistant', icon: Sparkles },
];

export function ScorecardDisplay({ scorecard, project }: ScorecardProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const { ai_analysis: analysis } = scorecard;
    const metadata = analysis.repoMetadata || {};
    const languages = analysis.languages || {};

    // Calculate language percentages
    const totalLangBytes = Object.values(languages).reduce((a, b) => a + b, 0);
    const languageBreakdown = Object.entries(languages)
        .map(([name, bytes]) => ({
            name,
            percentage: totalLangBytes > 0 ? (bytes / totalLangBytes) * 100 : 0,
            bytes
        }))
        .sort((a, b) => b.bytes - a.bytes);

    // Mock dependencies based on tech stack if not present
    const dependencies = analysis.techAreas.map(tech => ({
        name: tech.toLowerCase(),
        type: 'production' as const,
        version: 'latest'
    })).slice(0, 5);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header / Nav */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <nav className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 font-black italic text-xl tracking-tighter uppercase">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <span>GitRepoAI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                            <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
                            <span className="hover:text-foreground cursor-pointer transition-colors">Discover</span>
                            <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                                AI Search <Badge className="h-4 px-1.5 bg-orange-500 text-[10px] text-white border-none">New</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                                Adapt <Badge className="h-4 px-1.5 bg-orange-500 text-[10px] text-white border-none">New</Badge>
                            </div>
                            <span className="hover:text-foreground cursor-pointer transition-colors">Pricing</span>
                        </div>
                    </div>
                </nav>
            </header>

            <main className="max-w-[1400px] mx-auto w-full px-6 py-8 space-y-8">
                {/* Repo Header */}
                <RepoHeader
                    name={project.title}
                    description={metadata.description || project.description}
                    stats={{
                        stars: metadata.stargazers_count || 0,
                        forks: metadata.forks_count || 0,
                        watchers: metadata.watchers_count || 0,
                        issues: metadata.open_issues_count || 0
                    }}
                    htmlUrl={metadata.html_url || "#"}
                />

                {/* Score Grid */}
                <ScoreGrid
                    scores={{
                        quality: analysis.qualityScore || 0,
                        adaptation: analysis.adaptationScore || 0,
                        estimate: analysis.implementationEstimate || "N/A",
                        difficulty: analysis.difficulty || "Medium"
                    }}
                />

                {/* Tabs */}
                <div className="border-b border-border/50">
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                {['ai-search', 'adapt'].includes(tab.id) && (
                                    <Badge className="h-3 px-1 bg-orange-500 text-[8px] text-white border-none uppercase">New</Badge>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content + Sidebar Layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
                    {/* Left Side (Tabs Content) */}
                    <div className="lg:col-span-8 space-y-8">
                        {activeTab === 'overview' && (
                            <>
                                {/* Repository Overview */}
                                <Card className="border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold">Repository Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 md:grid-cols-2 gap-y-8 gap-x-12">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold opacity-60">Primary Language</p>
                                            <p className="text-lg font-bold">{metadata.language || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold opacity-60">License</p>
                                            <p className="text-lg font-bold">{metadata.license?.name || "No license"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold opacity-60">Created</p>
                                            <p className="text-lg font-bold">{metadata.created_at ? new Date(metadata.created_at).toLocaleDateString() : "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold opacity-60">Last Updated</p>
                                            <p className="text-lg font-bold">{metadata.updated_at ? new Date(metadata.updated_at).toLocaleDateString() : "3 days ago"}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Language Breakdown */}
                                <Card className="border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-bold">Language Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col md:flex-row items-center gap-12">
                                        {/* Simple SVG Donut Chart */}
                                        <div className="relative h-48 w-48 shrink-0">
                                            <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                                                {languageBreakdown.map((lang, i) => {
                                                    const total = 100;
                                                    const prevTotal = languageBreakdown.slice(0, i).reduce((sum, l) => sum + l.percentage, 0);
                                                    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#a855f7"];
                                                    const color = colors[i % colors.length];

                                                    return (
                                                        <circle
                                                            key={lang.name}
                                                            cx="18" cy="18" r="16"
                                                            fill="none"
                                                            stroke={color}
                                                            strokeWidth="4"
                                                            strokeDasharray={`${lang.percentage} ${total - lang.percentage}`}
                                                            strokeDashoffset={-prevTotal}
                                                            className="transition-all duration-500"
                                                        />
                                                    );
                                                })}
                                                {/* Center Circle for Donut Effect */}
                                                <circle cx="18" cy="18" r="12" fill="white" className="dark:fill-background" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-2xl font-black">{totalLangBytes ? languageBreakdown[0].name : "N/A"}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{totalLangBytes ? `${languageBreakdown[0].percentage.toFixed(1)}%` : "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
                                            {languageBreakdown.map((lang, i) => {
                                                const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#a855f7"];
                                                return (
                                                    <div key={lang.name} className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                                        <div className="flex-1 flex justify-between gap-4">
                                                            <span className="text-sm font-bold">{lang.name}</span>
                                                            <span className="text-sm text-muted-foreground">({lang.percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {activeTab === 'quality' && (
                            <div className="p-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
                                <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold mb-2">Detailed Quality Analysis</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto italic">
                                    Our AI is scanning code structures, documentation completeness, and issue resolution velocity...
                                </p>
                            </div>
                        )}

                        {activeTab === 'adaptation' && (
                            <div className="p-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
                                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold mb-2">Adaptation Insights</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto italic">
                                    Analyzing modularity, dependency coupling, and ease of integration for your project...
                                </p>
                            </div>
                        )}

                        {/* Fallback for other tabs */}
                        {!['overview', 'quality', 'adaptation'].includes(activeTab) && (
                            <div className="p-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
                                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto italic">
                                    We are working on bringing {TABS.find(t => t.id === activeTab)?.label} insights to your dashboard.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Side (Sidebar) */}
                    <aside className="lg:col-span-4 space-y-8">
                        <ConcernsSidebar
                            concerns={analysis.concerns || []}
                            dependencies={dependencies}
                        />
                    </aside>
                </div>
            </main>
        </div>
    );
}
