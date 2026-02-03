'use client'

import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

// Mock Data
const COMMUNITIES = [
    { id: '1', name: 'Python Beginners', icon: 'https://github.com/shadcn.png', memberCount: 1200, unreadCount: 5 },
    { id: '2', name: 'React Devs', icon: 'https://github.com/shadcn.png', memberCount: 3500, unreadCount: 0 },
    { id: '3', name: 'Backend Masters', icon: 'https://github.com/shadcn.png', memberCount: 890, unreadCount: 2 },
    { id: '4', name: 'AI & ML Hype', icon: 'https://github.com/shadcn.png', memberCount: 5600, unreadCount: 12 },
    { id: '5', name: 'Design Systems', icon: 'https://github.com/shadcn.png', memberCount: 1500, unreadCount: 0 },
]

export function CommunitySidebar() {
    // In a real app, get current community ID from params
    const activeId = '1'

    return (
        <div className="w-60 border-r border-border h-[calc(100vh-65px)] flex flex-col bg-background/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Communities</h2>
            </div>

            {/* Communities List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {COMMUNITIES.map((community) => (
                        <Link
                            key={community.id}
                            href={`/community/${community.id}`}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-lg transition-colors relative group",
                                activeId === community.id
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Avatar className="h-10 w-10 rounded-lg border border-border group-hover:border-primary/50 transition-colors">
                                <AvatarImage src={community.icon} />
                                <AvatarFallback>{community.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="font-medium text-sm truncate">{community.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {community.memberCount > 1000 ? `${(community.memberCount / 1000).toFixed(1)}k` : community.memberCount}
                                </p>
                            </div>
                            {community.unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full shadow-sm">
                                    {community.unreadCount}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </div>
            </ScrollArea>

            {/* Create Community Button */}
            <div className="p-4 border-t border-border bg-background">
                <Button className="w-full gap-2" variant="outline">
                    <Plus className="h-4 w-4" />
                    Create Community
                </Button>
            </div>
        </div>
    )
}
