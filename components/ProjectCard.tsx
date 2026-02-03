'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, ExternalLink, Github, Lightbulb, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

// Define a type for the project prop to avoid 'any'
interface Project {
    id: string
    title: string
    description: string
    repo_url: string
    demo_url?: string
    created_at: string
    likes_count: number
    comments_count: number
    challenge: string
    tech_stack: string[]
    user: {
        name: string
        username: string
        avatar: string
        bio?: string
    }
    scorecard?: {
        overall_score: number
    }
}

interface ProjectCardProps {
    project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
    const [isLiked, setIsLiked] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="group"
        >
            <Card className="border-0 border-b rounded-none p-4 hover:bg-accent/50 transition-colors cursor-pointer relative">
                {/* Author Info */}
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={project.user.avatar} />
                        <AvatarFallback>{project.user.name[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/profile/${project.user.username}`} className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                                {project.user.name}
                            </Link>
                            <span className="text-muted-foreground text-sm">@{project.user.username}</span>
                            <span className="text-muted-foreground text-sm">·</span>
                            <span className="text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                            </span>
                        </div>

                        {/* Project Content */}
                        <Link href={`/project/${project.id}`} className="block mt-2">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-muted-foreground mt-1 line-clamp-2">
                                {project.description}
                            </p>
                        </Link>

                        {/* Tech Stack */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {project.tech_stack.slice(0, 4).map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
                                    {tech}
                                </Badge>
                            ))}
                            {project.tech_stack.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                    +{project.tech_stack.length - 4}
                                </Badge>
                            )}
                        </div>

                        {/* Challenge Badge */}
                        <div className="mt-3">
                            <Badge variant="outline" className="gap-1.5">
                                <Lightbulb className="h-3 w-3" />
                                {project.challenge}
                            </Badge>
                        </div>

                        {/* Scorecard Preview (if exists) */}
                        {project.scorecard && (
                            <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">Skill Score</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            project.scorecard.overall_score >= 80 && "bg-green-500",
                                            project.scorecard.overall_score >= 60 && project.scorecard.overall_score < 80 && "bg-yellow-500",
                                            project.scorecard.overall_score >= 40 && project.scorecard.overall_score < 60 && "bg-orange-500",
                                            project.scorecard.overall_score < 40 && "bg-red-500"
                                        )} />
                                        <span className="font-bold text-lg">{project.scorecard.overall_score}/100</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 hover:text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsLiked(!isLiked);
                                }}
                            >
                                <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                                <span className="text-sm">{project.likes_count + (isLiked ? 1 : 0)}</span>
                            </Button>

                            <Button variant="ghost" size="sm" className="gap-2 hover:text-blue-500" onClick={(e) => e.stopPropagation()}>
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-sm">{project.comments_count}</span>
                            </Button>

                            <Button variant="ghost" size="sm" className="gap-2 hover:text-green-500" onClick={(e) => e.stopPropagation()}>
                                <Share2 className="h-4 w-4" />
                            </Button>

                            <div className="flex-1" />

                            <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-4 w-4" />
                                </a>
                            </Button>

                            {project.demo_url && (
                                <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                    <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
