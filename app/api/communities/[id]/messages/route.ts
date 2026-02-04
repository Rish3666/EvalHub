import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // Fetch messages with user details (if profiles table exists/policies allow, otherwise just message)
    // Assuming we have a public profiles table or similar, but for now we'll just get the user_id
    // and maybe client-side fetch or just show user_id if we have to.

    // Actually, we can use the `generateProjectAnalysis` user info if we had it, but standard is `auth.users` not joinable easily.
    // Let's assume we can select `*, metadata` or similar if we set it up. 
    // For this prototype, I'll fetch messages and return them.

    const { data, error } = await supabase
        .from('messages')
        .select('*, users(github_username, avatar_url, full_name)')
        .eq('community_id', params.id)
        .order('created_at', { ascending: true })
        .limit(100)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { content, reply_to_id, attachments } = await request.json()

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ error: 'Content or attachments required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                community_id: params.id,
                user_id: user.id,
                content: content || '',
                reply_to_id: reply_to_id || null,
                attachments: attachments || []
            })
            .select('*, users(github_username, avatar_url, full_name)')
            .single()

        if (error) {
            console.error("Message Insert Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err: any) {
        console.error("Message API Error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
