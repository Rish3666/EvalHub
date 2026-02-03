import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
        .from('community_members')
        .insert({
            community_id: params.id,
            user_id: session.user.id
        })

    if (error) {
        // Ignore duplicate key error (already joined)
        if (error.code !== '23505') {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    return NextResponse.json({ success: true })
}
