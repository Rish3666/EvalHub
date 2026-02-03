import { createClient } from '@/lib/supabase/server';
import { generateScorecard } from '@/lib/ai/gemini';
import { generateShareToken } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Check if scorecard already exists
        const { data: existing } = await supabase
            .from('scorecards')
            .select('id, share_token')
            .eq('project_id', id)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                scorecard: existing,
                message: 'Scorecard already generated',
            });
        }

        // Fetch project + analysis + answers
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(
                `
        *,
        project_analyses (*),
        project_answers (*)
      `
            )
            .eq('id', id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        if (project.user_id && project.user_id !== user?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!project.project_analyses?.[0]) {
            return NextResponse.json(
                { error: 'Project not analyzed yet' },
                { status: 400 }
            );
        }

        // Prepare context for AI
        const analysis = project.project_analyses[0];
        const context = {
            project: {
                title: project.title,
                description: project.description,
                techStack: project.tech_stack,
                challenge: project.challenge,
                solution: project.solution,
            },
            aiAnalysis: analysis.ai_analysis,
            questionsAndAnswers: analysis.questions.map((q: any) => {
                const answer = project.project_answers?.find(
                    (a: any) => a.question_id === q.id
                );
                return {
                    question: q.question,
                    expectedDepth: q.expectedDepth,
                    category: q.category,
                    answer: answer?.answer || '',
                    isSkipped: answer?.is_skipped || false,
                    timeSpent: answer?.time_spent_seconds || 0,
                };
            }),
        };

        // Generate scorecard with AI
        const scorecardData = await generateScorecard(context);

        // Generate unique share token
        const shareToken = generateShareToken();

        // Store scorecard
        const { data: scorecard, error: insertError } = await supabase
            .from('scorecards')
            .insert({
                project_id: id,
                overall_score: scorecardData.overallScore,
                skill_breakdown: scorecardData.skillBreakdown,
                technologies_known: scorecardData.technologiesYouKnow,
                skill_gaps: scorecardData.skillGaps,
                recommendations: scorecardData.recommendedNextSteps,
                strengths: scorecardData.strengths,
                areas_for_improvement: scorecardData.areasForImprovement,
                share_token: shareToken,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Scorecard insert error:', insertError);
            throw insertError;
        }

        return NextResponse.json({ success: true, scorecard });
    } catch (error) {
        console.error('Scorecard generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate scorecard' },
            { status: 500 }
        );
    }
}

// GET route for fetching existing scorecard
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: scorecard, error } = await supabase
            .from('scorecards')
            .select(
                `
        *,
        projects(
          title,
          description,
          tech_stack,
          repo_url,
          users(full_name, avatar_url)
        )
      `
            )
            .eq('project_id', id)
            .single();

        if (error || !scorecard) {
            return NextResponse.json(
                { error: 'Scorecard not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ scorecard });
    } catch (error) {
        console.error('Scorecard fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch scorecard' },
            { status: 500 }
        );
    }
}
