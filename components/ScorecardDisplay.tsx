'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Target,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    CheckCircle2,
    ArrowUpRight,
} from 'lucide-react';
import { getScoreColor, getPriorityColor } from '@/lib/utils';

interface ScorecardProps {
    scorecard: {
        overall_score: number;
        skill_breakdown: Record<
            string,
            { score: number; level: string; evidence: string }
        >;
        technologies_known: Array<{
            name: string;
            proficiency: string;
            percentage: number;
            evidence: string;
        }>;
        skill_gaps: Array<{
            skill: string;
            reason: string;
            priority: string;
            learningPath: {
                beginner: string;
                intermediate: string;
                projectIdea: string;
            };
        }>;
        recommendations: string[];
        strengths: string[];
        areas_for_improvement: string[];
    };
    project: {
        title: string;
        author: { full_name: string };
    };
}

export function ScorecardDisplay({ scorecard, project }: ScorecardProps) {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold">DevShowcase Skill Scorecard</h1>
                <p className="text-muted-foreground">
                    {project.title} by {project.author.full_name}
                </p>
            </div>

            {/* Overall Score */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target className="h-6 w-6" />
                            <span className="text-lg font-semibold">
                                Overall Technical Score
                            </span>
                        </div>
                        <div
                            className={`text-5xl font-bold ${getScoreColor(
                                scorecard.overall_score
                            )}`}
                        >
                            {scorecard.overall_score}/100
                        </div>
                    </div>
                    <Progress value={scorecard.overall_score} className="h-3" />
                </CardContent>
            </Card>

            {/* Skill Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Skill Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(scorecard.skill_breakdown).map(([key, data]) => (
                        <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-medium capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <Badge variant="outline" className="ml-2">
                                        {data.level}
                                    </Badge>
                                </div>
                                <span className={`font-bold ${getScoreColor(data.score)}`}>
                                    {data.score}/100
                                </span>
                            </div>
                            <Progress value={data.score} />
                            <p className="text-sm text-muted-foreground">{data.evidence}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Technologies */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Technologies You Know
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {scorecard.technologies_known.map((tech) => (
                        <div key={tech.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{tech.name}</span>
                                <div className="flex items-center gap-2">
                                    <Badge>{tech.proficiency}</Badge>
                                    <span className="font-bold">{tech.percentage}%</span>
                                </div>
                            </div>
                            <Progress value={tech.percentage} />
                            <p className="text-sm text-muted-foreground">{tech.evidence}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Skill Gaps & Learning Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {scorecard.skill_gaps.map((gap, idx) => (
                        <div key={idx} className="space-y-3">
                            <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-lg">{gap.skill}</h4>
                                <Badge variant={getPriorityColor(gap.priority)}>
                                    {gap.priority} Priority
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{gap.reason}</p>

                            <div className="pl-4 border-l-2 space-y-2">
                                <div>
                                    <span className="text-sm font-medium">📚 Beginner: </span>
                                    <span className="text-sm">{gap.learningPath.beginner}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">
                                        📈 Intermediate:{' '}
                                    </span>
                                    <span className="text-sm">
                                        {gap.learningPath.intermediate}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium">🛠️ Practice: </span>
                                    <span className="text-sm">
                                        {gap.learningPath.projectIdea}
                                    </span>
                                </div>
                            </div>

                            {idx < scorecard.skill_gaps.length - 1 && <Separator />}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5" />
                        Recommended Next Steps
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {scorecard.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Strengths & Improvements Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">✨ Your Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {scorecard.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-green-600">•</span>
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-orange-600">
                            📈 Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {scorecard.areas_for_improvement.map((area, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-orange-600">•</span>
                                    <span>{area}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
