import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('community_members')
        .select(`
            user_id,
            users (
                id,
                github_username,
                full_name,
                avatar_url,
                online_status,
                last_seen
            )
        `)
        .eq('community_id', params.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten data to return a clean member list
    const members = data.map((item: any) => item.users).filter(Boolean)

    return NextResponse.json(members)
}
