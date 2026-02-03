import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch pending requests received by current user
        // We need to join with profiles to get requester details
        const { data: requests, error } = await supabase
            .from('friend_requests')
            .select(`
                id,
                created_at,
                requester:users!friend_requests_requester_id_fkey (
                    id,
                    github_username,
                    avatar_url,
                    full_name
                )
            `)
            .eq('addressee_id', session.user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Fetch Inbox Error:", error)
            return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
        }

        return NextResponse.json(requests)

    } catch (error) {
        console.error("Inbox API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
