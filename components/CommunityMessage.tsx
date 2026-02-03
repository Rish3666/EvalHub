'use client'

import { Heart, MessageCircle, Share2, FileText, Download, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface MessageProps {
    message: {
        id: string
        content: string
        created_at: string
        likes_count: number
        replies_count: number
        author: {
            name: string
            avatar: string
        }
        attachments?: Array<{
            id: string
            name: string
            size: string
        }>
    }
}

export function CommunityMessage({ message }: MessageProps) {
    return (
        <div className="group p-4 hover:bg-accent/40 transition-colors -mx-4 px-4 rounded-lg">
            <div className="flex gap-4">
                <Avatar className="mt-1">
                    <AvatarImage src={message.author.avatar} />
                    <AvatarFallback>{message.author.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="font-semibold hover:underline cursor-pointer">{message.author.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {message.content}
                    </div>

                    {/* Attachments */}
                    {message.attachments?.map((file) => (
                        <Card key={file.id} className="mt-3 p-3 max-w-md bg-background/50 hover:bg-background transition-colors border-dashed">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{file.size}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 hover:text-red-500 hover:bg-red-500/10">
                            <Heart className="h-4 w-4" />
                            <span className="text-xs font-medium">{message.likes_count > 0 && message.likes_count}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 hover:text-blue-500 hover:bg-blue-500/10">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">{message.replies_count > 0 && message.replies_count} Reply</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 hover:text-green-500 hover:bg-green-500/10">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
