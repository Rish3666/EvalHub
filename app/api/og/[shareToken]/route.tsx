import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ shareToken: string }> }
) {
    try {
        const { shareToken } = await params;
        const supabase = await createClient();

        const { data: scorecard, error } = await supabase
            .from('scorecards')
            .select(
                `
        overall_score,
        technologies_known,
        projects!inner(title, users!inner(full_name))
      `
            )
            .eq('share_token', shareToken)
            .single();

        if (error || !scorecard) {
            return new Response('Scorecard not found', { status: 404 });
        }

        const topTechs = (scorecard.technologies_known as any[]).slice(0, 4);

        return new ImageResponse(
            (
                <div
                    style={{
                        width: '1200px',
                        height: '630px',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '60px',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            fontSize: 56,
                            fontWeight: 700,
                            color: 'white',
                            marginBottom: 20,
                        }}
                    >
                        {(scorecard.projects as any).title}
                    </div>

                    <div
                        style={{
                            fontSize: 32,
                            color: 'rgba(255,255,255,0.9)',
                            marginBottom: 40,
                        }}
                    >
                        by {(scorecard.projects as any).users.full_name}
                    </div>

                    {/* Overall Score */}
                    <div
                        style={{
                            fontSize: 96,
                            fontWeight: 900,
                            color: 'white',
                            marginBottom: 50,
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 20,
                        }}
                    >
                        {scorecard.overall_score}
                        <span style={{ fontSize: 48, opacity: 0.8 }}>/100</span>
                    </div>

                    {/* Top Technologies */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        {topTechs.map((tech: any) => (
                            <div
                                key={tech.name}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '20px 30px',
                                    borderRadius: 12,
                                    color: 'white',
                                    fontSize: 28,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{tech.name}</div>
                                <div style={{ opacity: 0.9 }}>{tech.percentage}%</div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            fontSize: 28,
                            color: 'white',
                            marginTop: 'auto',
                            opacity: 0.9,
                        }}
                    >
                        DevShowcase.com • AI-Powered Developer Analysis
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('OG image generation error:', error);
        return new Response('Failed to generate image', { status: 500 });
    }
}
