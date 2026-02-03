import { createClient } from '@/lib/supabase/server';
import { fetchREADME } from '@/lib/utils/github';
import { analyzeREADMEWithFallback } from '@/lib/ai/gemini';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Authenticate user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch project and verify ownership
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if already analyzed (prevent duplicate API calls)
        const { data: existingAnalysis } = await supabase
            .from('project_analyses')
            .select('id')
            .eq('project_id', id)
            .single();

        if (existingAnalysis) {
            return NextResponse.json(
                {
                    error: 'Project already analyzed',
                    analysisId: existingAnalysis.id,
                },
                { status: 409 }
            );
        }

        // Fetch README from GitHub
        const readme = await fetchREADME(project.repo_url);
        if (!readme) {
            return NextResponse.json(
                {
                    error:
                        'README.md not found in repository. Please ensure your repo has a README file.',
                },
                { status: 404 }
            );
        }

        // Analyze with Claude (with fallback)
        const analysis = await analyzeREADMEWithFallback(readme, {
            title: project.title,
            description: project.description,
            techStack: project.tech_stack,
            challenge: project.challenge || '',
            solution: project.solution || '',
        });

        // Store analysis
        const { data: analysisRecord, error: insertError } = await supabase
            .from('project_analyses')
            .insert({
                project_id: id,
                readme_content: readme.slice(0, 15000), // Store first 15k chars
                ai_analysis: analysis.analysis,
                questions: analysis.questions,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
        }

        return NextResponse.json({
            success: true,
            analysis: analysisRecord,
            message: 'AI analysis complete! Ready for Q&A.',
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            {
                error: 'AI analysis failed. Please try again or contact support.',
            },
            { status: 500 }
        );
    }
}
