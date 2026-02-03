'use client';

import { Button } from '@/components/ui/button';
import { Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
    shareToken: string;
    score: number;
    projectTitle: string;
    viewsCount?: number;
}

export function ShareButtons({
    shareToken,
    score,
    projectTitle,
    viewsCount = 0,
}: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scorecard/${shareToken}`;

    const shareToTwitter = () => {
        const text = `I scored ${score}/100 on my ${projectTitle} project analysis! 🚀\n\nCheck out my DevShowcase scorecard:`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                text
            )}&url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                shareUrl
            )}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast({
                title: 'Link copied!',
                description: 'Share your scorecard anywhere',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: 'Failed to copy',
                description: 'Please copy the link manually',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg border">
            <h3 className="text-lg font-semibold">Share Your Scorecard</h3>
            <div className="flex gap-2 flex-wrap justify-center">
                <Button onClick={shareToTwitter} variant="outline" size="lg">
                    <Twitter className="mr-2 h-4 w-4" />
                    Share on Twitter
                </Button>
                <Button onClick={shareToLinkedIn} variant="outline" size="lg">
                    <Linkedin className="mr-2 h-4 w-4" />
                    Share on LinkedIn
                </Button>
                <Button onClick={copyLink} variant="outline" size="lg">
                    {copied ? (
                        <>
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Copy Link
                        </>
                    )}
                </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
                {viewsCount} {viewsCount === 1 ? 'person has' : 'people have'} viewed
                your scorecard
            </p>
        </div>
    );
}
