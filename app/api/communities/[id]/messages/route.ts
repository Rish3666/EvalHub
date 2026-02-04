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
        const payload = await request.json()
        const { content, reply_to_id, attachments } = payload

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ error: 'Content or attachments required' }, { status: 400 })
        }

        // Verify user exists in public.users to prevent FK error
        const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).single()

        if (!profile) {
            console.error("User profile missing in public.users. Attempting sync...")
            // Attempt to self-heal by inserting the user from auth data
            const { error: syncError } = await supabase.from('users').insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata.full_name,
                avatar_url: user.user_metadata.avatar_url,
                github_username: user.user_metadata.user_name
            })

            if (syncError) {
                console.error("Failed to sync user profile:", syncError)
                return NextResponse.json({ error: 'User profile missing and sync failed' }, { status: 500 })
            }
        }

        // Check if community exists
        // const { data: community } = await supabase.from('communities').select('id').eq('id', params.id).single()
        // if (!community) {
        //      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
        // }

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
            console.error("Message Insert Error Detail:", JSON.stringify(error, null, 2))
            return NextResponse.json({ error: error.message, details: error }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err: any) {
        console.error("Message API Exception:", err)
        return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 })
    }
}
