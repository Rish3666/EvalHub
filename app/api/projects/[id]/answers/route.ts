import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Authenticate user (optional)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Verify project ownership if project has an owner
        const { data: project } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', id)
            .single();

        if (project && project.user_id && project.user_id !== user?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { questionId, answer, isSkipped, timeSpent } = body;

        // Upsert answer (allows editing)
        const { data: answerRecord, error: upsertError } = await supabase
            .from('project_answers')
            .upsert(
                {
                    project_id: id,
                    question_id: questionId,
                    answer: answer || null,
                    is_skipped: isSkipped || false,
                    time_spent_seconds: timeSpent || 0,
                },
                {
                    onConflict: 'project_id,question_id',
                }
            )
            .select()
            .single();

        if (upsertError) {
            console.error('Upsert error:', upsertError);
            throw upsertError;
        }

        return NextResponse.json({
            success: true,
            answer: answerRecord,
            message: 'Answer saved successfully',
        });
    } catch (error) {
        console.error('Answer save error:', error);
        return NextResponse.json(
            {
                error: 'Failed to save answer.',
            },
            { status: 500 }
        );
    }
}
