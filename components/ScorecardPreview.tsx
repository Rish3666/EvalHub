'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Award, Sparkles, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScorecardPreviewProps {
    scorecard: {
        project_id: string
        share_token: string
        overall_score: number
        skill_breakdown: Record<string, { score: number }>
    }
}

export function ScorecardPreview({ scorecard }: ScorecardPreviewProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'green'
        if (score >= 60) return 'yellow'
        if (score >= 40) return 'orange'
        return 'red'
    }

    const color = getScoreColor(scorecard.overall_score)

    // Map color to Tailwind classes since dynamic interpolation can be tricky
    const colorClasses = {
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        orange: "bg-orange-500",
        red: "bg-red-500"
    }

    return (
        <Card className="relative overflow-hidden border-2 border-primary/20">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />

            <CardContent className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">AI Skill Scorecard</h3>
                    </div>
                    <Badge variant="outline" className="gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        AI-Verified
                    </Badge>
                </div>

                {/* Overall Score */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                    <span className="text-sm font-medium">Overall Score</span>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-3 w-3 rounded-full animate-pulse",
                            colorClasses[color]
                        )} />
                        <span className="text-2xl font-bold">{scorecard.overall_score}/100</span>
                    </div>
                </div>

                {/* Skill Breakdown */}
                <div className="space-y-2">
                    {Object.entries(scorecard.skill_breakdown).slice(0, 3).map(([skill, data]) => (
                        <div key={skill} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="font-medium">{data.score}%</span>
                            </div>
                            <Progress value={data.score} className="h-2" />
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <Button className="flex-1" asChild>
                        <Link href={`/project/${scorecard.project_id}/scorecard`}>
                            View Full Scorecard
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/scorecard/${scorecard.share_token}`}>
                            <Share2 className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
