import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
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

        // Fetch analysis with questions
        const { data: analysis, error: analysisError } = await supabase
            .from('project_analyses')
            .select('questions')
            .eq('project_id', id)
            .single();

        if (analysisError || !analysis) {
            return NextResponse.json(
                {
                    error:
                        'Analysis not found. Please run analysis first.',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            questions: analysis.questions,
        });
    } catch (error) {
        console.error('Questions fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch questions.',
            },
            { status: 500 }
        );
    }
}
