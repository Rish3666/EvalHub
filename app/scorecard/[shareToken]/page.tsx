import { createClient } from '@/lib/supabase/server';
import { ScorecardDisplay } from '@/components/ScorecardDisplay';
import { ShareButtons } from '@/components/ShareButtons';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ shareToken: string }>;
}): Promise<Metadata> {
    const { shareToken } = await params;
    const supabase = await createClient();

    const { data: scorecard } = await supabase
        .from('scorecards')
        .select(
            `
      overall_score,
      strengths,
      projects!inner(title, users!inner(full_name))
    `
        )
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

    if (!scorecard) {
        return {
            title: 'Scorecard Not Found',
        };
    }

    const title = `${(scorecard.projects as any).title} - DevShowcase Scorecard`;
    const description = `${(scorecard.projects as any).users.full_name} scored ${scorecard.overall_score
        }/100 | ${(scorecard.strengths as string[]).slice(0, 2).join(', ')}`;
    const ogImage = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/og/${shareToken}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [ogImage],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function PublicScorecardPage({
    params,
}: {
    params: Promise<{ shareToken: string }>;
}) {
    const { shareToken } = await params;
    const supabase = await createClient();

    const { data: scorecard } = await supabase
        .from('scorecards')
        .select(
            `
      *,
      projects!inner(
        title,
        description,
        tech_stack,
        repo_url,
        users!inner(full_name, avatar_url)
      )
    `
        )
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

    if (!scorecard) notFound();

    // Increment view count
    await supabase.rpc('increment_scorecard_views', {
        token: shareToken,
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <ScorecardDisplay
                scorecard={scorecard as any}
                project={{
                    title: (scorecard.projects as any).title,
                    description: (scorecard.projects as any).description,
                    author: (scorecard.projects as any).users,
                }}
            />

            <div className="max-w-4xl mx-auto px-6 pb-12">
                <ShareButtons
                    shareToken={scorecard.share_token}
                    score={scorecard.overall_score}
                    projectTitle={(scorecard.projects as any).title}
                    viewsCount={scorecard.views_count}
                />
            </div>
        </div>
    );
}
