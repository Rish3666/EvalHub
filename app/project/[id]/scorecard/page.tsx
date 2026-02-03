'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScorecardDisplay } from '@/components/ScorecardDisplay';
import { ShareButtons } from '@/components/ShareButtons';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ScorecardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [projectId, setProjectId] = useState<string>('');
    const [scorecard, setScorecard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        params.then((p) => {
            setProjectId(p.id);
            const shouldGenerate = searchParams.get('generate') === 'true';

            if (shouldGenerate) {
                generateScorecard(p.id);
            } else {
                fetchScorecard(p.id);
            }
        });
    }, [searchParams]);

    async function generateScorecard(id: string) {
        setGenerating(true);
        try {
            const res = await fetch(`/api/projects/${id}/scorecard`, {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast({
                title: 'Scorecard generated!',
                description: 'Your AI-powered skill analysis is ready.',
            });

            // Fetch the full scorecard data
            await fetchScorecard(id);
        } catch (error: any) {
            toast({
                title: 'Generation failed',
                description: error.message,
                variant: 'destructive',
            });
            setLoading(false);
        } finally {
            setGenerating(false);
        }
    }

    async function fetchScorecard(id: string) {
        try {
            const res = await fetch(`/api/projects/${id}/scorecard`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setScorecard(data.scorecard);
        } catch (error: any) {
            toast({
                title: 'Error loading scorecard',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    if (loading || generating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">
                    {generating
                        ? 'Generating your scorecard with AI...'
                        : 'Loading scorecard...'}
                </p>
            </div>
        );
    }

    if (!scorecard) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Scorecard not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <ScorecardDisplay
                scorecard={scorecard}
                project={{
                    title: scorecard.projects.title,
                    author: scorecard.projects.users,
                }}
            />

            <div className="max-w-4xl mx-auto px-6 pb-12">
                <ShareButtons
                    shareToken={scorecard.share_token}
                    score={scorecard.overall_score}
                    projectTitle={scorecard.projects.title}
                    viewsCount={scorecard.views_count}
                />
            </div>
        </div>
    );
}
