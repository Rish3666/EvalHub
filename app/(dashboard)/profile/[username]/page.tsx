'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Camera, Share2, Settings, MapPin, Calendar, Github, Grid, Award, Activity, UserPlus, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sidebar } from '@/components/Sidebar'
import { ProjectCard } from '@/components/ProjectCard'
import { ScorecardPreview } from '@/components/ScorecardPreview'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { User as SupabaseUser } from '@supabase/supabase-js'

// Mock User Data
const MOCK_USER = {
    name: 'Alex Chen',
    username: 'alexchen',
    bio: 'Full Stack Developer building things with Next.js and AI. Open source enthusiast and coffee lover.',
    location: 'San Francisco, CA',
    created_at: '2025-01-15T12:00:00Z',
    github_username: 'alexchen',
    avatar: 'https://github.com/shadcn.png',
    projects_count: 12,
    total_likes: 450,
    followers_count: 89,
    projects: [
        {
            id: '1',
            title: 'HealthQueue - Hospital Management System',
            description: 'Real-time hospital queue management with SMS alerts.',
            repo_url: 'https://github.com/alexchen/healthqueue',
            demo_url: 'https://healthqueue.demo.com',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            likes_count: 42,
            comments_count: 12,
            challenge: 'Third-Party API Integration',
            tech_stack: ['React', 'Node.js', 'PostgreSQL'],
            user: {
                name: 'Alex Chen',
                username: 'alexchen',
                avatar: 'https://github.com/shadcn.png'
            },
            scorecard: {
                overall_score: 85
            }
        },
        {
            id: '3',
            title: 'AI Code Reviewer',
            description: 'Automated code review agent using LLMs to detect bugs and security vulnerabilities.',
            repo_url: 'https://github.com/alexchen/ai-reviewer',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            likes_count: 156,
            comments_count: 28,
            challenge: 'LLM Context Management',
            tech_stack: ['Python', 'LangChain', 'OpenAI'],
            user: {
                name: 'Alex Chen',
                username: 'alexchen',
                avatar: 'https://github.com/shadcn.png'
            }
        }
    ],
    scorecards: [
        {
            project_id: '1',
            share_token: 'abc-123',
            overall_score: 85,
            skill_breakdown: {
                'Technical Depth': { score: 90 },
                'Problem Solving': { score: 85 },
                'Code Quality': { score: 75 }
            }
        }
    ]
}

export default function ProfilePage({ params }: { params: { username: string } }) {
    const supabase = createClient()
    const { toast } = useToast()
    const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<{
        id: string
        username: string
        full_name: string | null
        avatar_url: string | null
        bio: string | null
        location: string | null
        github_username: string | null
        created_at: string
    } | null>(null)
    const [profileState, setProfileState] = useState<'loading' | 'ready' | 'not_found'>('loading')
    const [friendRequest, setFriendRequest] = useState<{
        id: string
        requester_id: string
        addressee_id: string
        status: 'pending' | 'accepted' | 'declined'
    } | null>(null)
    const [requestLoading, setRequestLoading] = useState(false)

    useEffect(() => {
        let isMounted = true
        const loadProfile = async () => {
            setProfileState('loading')
            const { data: { user } } = await supabase.auth.getUser()
            if (!isMounted) return
            setCurrentUser(user ?? null)

            const { data: publicProfile } = await supabase
                .from('public_profiles')
                .select('id, username, full_name, avatar_url, bio, location, github_username, created_at')
                .eq('username', params.username)
                .maybeSingle()

            if (publicProfile) {
                setProfile(publicProfile)
                setProfileState('ready')
                return
            }

            if (user) {
                const { data: privateProfile } = await supabase
                    .from('users')
                    .select('id, username, full_name, avatar_url, bio, location, github_username, created_at')
                    .eq('id', user.id)
                    .eq('username', params.username)
                    .maybeSingle()

                if (privateProfile) {
                    setProfile(privateProfile)
                    setProfileState('ready')
                    return
                }
            }

            setProfileState('not_found')
        }

        loadProfile()
        return () => {
            isMounted = false
        }
    }, [params.username, supabase])

    useEffect(() => {
        const loadFriendRequest = async () => {
            if (!currentUser || !profile || currentUser.id === profile.id) {
                setFriendRequest(null)
                return
            }

            const { data } = await supabase
                .from('friend_requests')
                .select('id, requester_id, addressee_id, status')
                .or(
                    `and(requester_id.eq.${currentUser.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${currentUser.id})`
                )
                .maybeSingle()

            setFriendRequest(data || null)
        }

        loadFriendRequest()
    }, [currentUser, profile, supabase])

    const friendButtonState = useMemo(() => {
        if (!currentUser || !profile || currentUser.id === profile.id) return null
        if (!friendRequest) {
            return { label: 'Add Friend', icon: UserPlus, disabled: false }
        }
        if (friendRequest.status === 'accepted') {
            return { label: 'Friends', icon: Check, disabled: true }
        }
        if (friendRequest.status === 'pending') {
            if (friendRequest.requester_id === currentUser.id) {
                return { label: 'Request Sent', icon: Clock, disabled: true }
            }
            return { label: 'Request Received', icon: Clock, disabled: true }
        }
        return { label: 'Add Friend', icon: UserPlus, disabled: false }
    }, [currentUser, profile, friendRequest])

    const handleSendRequest = async () => {
        if (!currentUser || !profile) return
        setRequestLoading(true)
        const { error, data } = await supabase
            .from('friend_requests')
            .insert({
                requester_id: currentUser.id,
                addressee_id: profile.id,
            })
            .select('id, requester_id, addressee_id, status')
            .single()

        if (error) {
            toast({
                title: 'Unable to send request',
                description: error.message,
                variant: 'destructive',
            })
        } else {
            setFriendRequest(data)
            toast({
                title: 'Friend request sent',
                description: `You can follow up with @${profile.username} from their profile.`,
            })
        }
        setRequestLoading(false)
    }

    const displayName = profile?.full_name || profile?.username || MOCK_USER.name
    const displayUsername = profile?.username || MOCK_USER.username
    const displayAvatar = profile?.avatar_url || MOCK_USER.avatar
    const displayBio = profile?.bio || MOCK_USER.bio
    const displayLocation = profile?.location || MOCK_USER.location
    const displayGithub = profile?.github_username || MOCK_USER.github_username
    const displayCreatedAt = profile?.created_at || MOCK_USER.created_at

    if (profileState === 'loading') {
        return (
            <div className="min-h-screen bg-background flex justify-center">
                <Sidebar />
                <main className="flex-1 max-w-5xl min-h-screen md:ml-[240px] border-x border-border">
                    <div className="px-6 py-10 border-b border-border text-muted-foreground">
                        Loading profile...
                    </div>
                </main>
            </div>
        )
    }

    if (profileState === 'not_found') {
        return (
            <div className="min-h-screen bg-background flex justify-center">
                <Sidebar />
                <main className="flex-1 max-w-5xl min-h-screen md:ml-[240px] border-x border-border">
                    <div className="px-6 py-10 border-b border-border text-muted-foreground">
                        Profile not found. Try searching again from the header.
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <Sidebar />

            <main className="flex-1 max-w-5xl min-h-screen md:ml-[240px] border-x border-border">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative group">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        Change Cover
                    </Button>
                </div>

                <div className="px-6 pb-20">
                    {/* Header / Avatar */}
                    <div className="relative mb-4">
                        <Avatar className="h-32 w-32 border-4 border-background -mt-16 relative shadow-lg">
                            <AvatarImage src={displayAvatar} />
                            <AvatarFallback className="text-3xl">{displayName[0]}</AvatarFallback>
                        </Avatar>

                        <div className="absolute top-4 right-0 flex gap-2">
                            <Button variant="outline" size="sm" className="hidden sm:flex">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Profile
                            </Button>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            {friendButtonState ? (() => {
                                const Icon = friendButtonState.icon
                                return (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden sm:flex"
                                    onClick={() => {
                                        if (!friendButtonState.disabled) handleSendRequest()
                                    }}
                                    disabled={friendButtonState.disabled || requestLoading}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {requestLoading ? 'Sending...' : friendButtonState.label}
                                </Button>
                                )
                            })() : (
                                <Button variant="outline" size="sm" className="hidden sm:flex">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            )}
                            {friendButtonState ? (() => {
                                const Icon = friendButtonState.icon
                                return (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="sm:hidden"
                                    onClick={() => {
                                        if (!friendButtonState.disabled) handleSendRequest()
                                    }}
                                    disabled={friendButtonState.disabled || requestLoading}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                                )
                            })() : (
                                <Button size="icon" variant="outline" className="sm:hidden">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-3xl font-bold">{displayName}</h1>
                            <p className="text-muted-foreground">@{displayUsername}</p>
                        </div>

                        <p className="text-base max-w-2xl leading-relaxed">{displayBio}</p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {displayLocation && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {displayLocation}
                                </div>
                            )}
                            {displayCreatedAt && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Joined {formatDistanceToNow(new Date(displayCreatedAt), { addSuffix: true })}
                                </div>
                            )}
                            {displayGithub && (
                                <a
                                    href={`https://github.com/${displayGithub}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                                >
                                    <Github className="h-4 w-4" />
                                    {displayGithub}
                                </a>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 py-2 border-y border-border/50">
                            <div className="text-center sm:text-left">
                                <span className="font-bold text-xl block">{MOCK_USER.projects_count}</span>
                                <span className="text-muted-foreground text-sm">Projects</span>
                            </div>
                            <div className="text-center sm:text-left">
                                <span className="font-bold text-xl block">{MOCK_USER.total_likes}</span>
                                <span className="text-muted-foreground text-sm">Likes</span>
                            </div>
                            <div className="text-center sm:text-left">
                                <span className="font-bold text-xl block">{MOCK_USER.followers_count}</span>
                                <span className="text-muted-foreground text-sm">Followers</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="projects" className="mt-8">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
                            <TabsTrigger
                                value="projects"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors gap-2"
                            >
                                <Grid className="h-4 w-4" />
                                Projects
                            </TabsTrigger>
                            <TabsTrigger
                                value="scorecards"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors gap-2"
                            >
                                <Award className="h-4 w-4" />
                                Scorecards
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors gap-2"
                            >
                                <Activity className="h-4 w-4" />
                                Activity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_USER.projects.map((project) => (
                                    <ProjectCard key={project.id} project={project as any} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="scorecards" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MOCK_USER.scorecards.map((scorecard) => (
                                    <ScorecardPreview key={scorecard.project_id} scorecard={scorecard} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-6">
                            <div className="text-center py-10 text-muted-foreground">
                                <Activity className="h-10 w-10 mx-auto mb-4 opacity-50" />
                                <p>Recent activity will appear here</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
