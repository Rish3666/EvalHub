'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Edit, Trash2, Share2, Github, ExternalLink,
    Lightbulb, Sparkles, Award, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from '@/components/Sidebar'
import { ScorecardPreview } from '@/components/ScorecardPreview'
import { formatDistanceToNow } from 'date-fns'

// Mock Data for a single project
const MOCK_PROJECT = {
    id: '1',
    title: 'HealthQueue - Hospital Management System',
    description: 'Real-time hospital queue management with SMS alerts. This project aims to reduce patient waiting times by providing real-time updates via SMS and a live dashboard.',
    long_description: 'HealthQueue is a comprehensive solution designed to streamline hospital operations. It features a patient registration portal, a triage management system, and an automated SMS notification service built with Twilio. The backend is powered by Node.js and PostgreSQL, ensuring data integrity and fast retrieval speeds. One of the key technical achievements was implementing a robust webhook handling system for SMS delivery status updates, which utilizes exponential backoff for retries, effectively reducing our failure rate from 15% to under 0.3%.',
    repo_url: 'https://github.com/alexchen/healthqueue',
    demo_url: 'https://healthqueue.demo.com',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    likes_count: 42,
    comments_count: 12,
    challenge: 'Third-Party API Integration',
    solution: 'Implemented webhook retries with exponential backoff. Reduced SMS failure rate from 15% to 0.3%.',
    tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Twilio', 'Redis', 'Docker'],
    user: {
        name: 'Alex Chen',
        username: 'alexchen',
        avatar: 'https://github.com/shadcn.png',
        bio: 'Full Stack Developer | Open Source Enthusiast'
    },
    // Example of a project WITH a scorecard
    scorecard: {
        project_id: '1',
        share_token: 'abc-123',
        overall_score: 85,
        skill_breakdown: {
            'Technical Depth': { score: 90 },
            'Problem Solving': { score: 85 },
            'Code Quality': { score: 75 }
        }
    }
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
    // In a real app, fetch project by params.id
    const project = MOCK_PROJECT

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <Sidebar />

            <main className="flex-1 max-w-4xl min-h-screen md:ml-[240px] p-6 pb-20">
                {/* Back Button & Actions */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                        <Link href="/feed">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Feed
                        </Link>
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                        <Button variant="outline" size="sm">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>

                {/* Project Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">{project.title}</h1>
                            <p className="text-xl text-muted-foreground mt-2">{project.description}</p>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={project.user.avatar} />
                                <AvatarFallback>{project.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{project.user.name}</span>
                            <span>(@{project.user.username})</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span>Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        {project.tech_stack.map((tech) => (
                            <Badge key={tech} variant="secondary" className="px-3 py-1 text-sm">
                                {tech}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left Col) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Challenge & Solution */}
                        <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-primary/10">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4 text-primary">
                                    <Lightbulb className="h-5 w-5" />
                                    <h3 className="font-semibold text-lg">The Challenge</h3>
                                </div>
                                <p className="text-lg font-medium mb-2">{project.challenge}</p>
                                <p className="text-muted-foreground leading-relaxed">
                                    "{project.solution}"
                                </p>

                                <Separator className="my-6" />

                                <h3 className="font-semibold text-lg mb-3">Project Details</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {project.long_description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Links */}
                        <div className="flex gap-4">
                            <Button size="lg" className="flex-1" asChild>
                                <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="mr-2 h-5 w-5" />
                                    View on GitHub
                                </a>
                            </Button>
                            {project.demo_url && (
                                <Button size="lg" variant="outline" className="flex-1" asChild>
                                    <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-5 w-5" />
                                        Live Demo
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* Comments Placeholder */}
                        <div className="pt-8 border-t border-border">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <MessageSquare className="h-5 w-5" />
                                Comments ({project.comments_count})
                            </h3>
                            <div className="bg-accent/30 rounded-lg p-8 text-center text-muted-foreground">
                                Comments section coming soon...
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right Col) */}
                    <div className="space-y-6">
                        {/* AI Analysis / Scorecard Section */}
                        {project.scorecard ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    Skill Scorecard
                                </h3>
                                <ScorecardPreview scorecard={project.scorecard} />
                            </div>
                        ) : (
                            <Card className="border-2 border-primary border-dashed bg-primary/5">
                                <CardContent className="p-6 text-center space-y-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">AI Skill Analysis</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Get a detailed breakdown of your technical skills, code quality, and problem-solving abilities.
                                        </p>
                                    </div>
                                    <Button className="w-full gap-2">
                                        Start AI Analysis
                                        <ArrowLeft className="h-4 w-4 rotate-180" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Author Profile */}
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Created By</h3>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={project.user.avatar} />
                                        <AvatarFallback>{project.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Link href={`/profile/${project.user.username}`} className="font-bold hover:underline">
                                            {project.user.name}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">@{project.user.username}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{project.user.bio}</p>
                                <Button variant="outline" className="w-full">
                                    View Profile
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
