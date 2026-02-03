'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, FolderGit2, Users, User, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
    { icon: Home, label: 'Home', href: '/feed' },
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FolderGit2, label: 'Projects', href: '/projects' },
    { icon: Users, label: 'Community', href: '/community' },
    { icon: User, label: 'Profile', href: '/profile' },
]

export function Sidebar() {
    const pathname = usePathname()

    // Mock user data for now
    const user = {
        name: 'Alex Chen',
        username: 'alexchen',
        avatar: 'https://github.com/shadcn.png'
    }

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-background hidden md:block">
            <div className="flex h-full flex-col gap-2 p-4">
                {/* Logo */}
                <Link href="/feed" className="flex items-center gap-2 px-2 py-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        DevShowcase
                    </span>
                </Link>

                <Separator className="my-2" />

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isActive && "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-primary border-l-2 border-primary"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}

                    <Separator className="my-4" />

                    {/* Upload New Project Button */}
                    <Button className="w-full justify-start gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        <Plus className="h-5 w-5" />
                        Upload Project
                    </Button>
                </nav>

                {/* User Profile at Bottom */}
                <div className="border-t border-border pt-4">
                    <Link href="/settings" className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                        <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </Link>
                </div>
            </div>
        </aside>
    )
}
