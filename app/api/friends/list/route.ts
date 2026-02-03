import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Fetch accepted friend requests where user is either side
        const { data, error } = await supabase
            .from('friend_requests')
            .select(`
                id,
                requester_id,
                addressee_id,
                requester:users!friend_requests_requester_id_fkey (id, avatar_url, full_name, github_username),
                addressee:users!friend_requests_addressee_id_fkey (id, avatar_url, full_name, github_username)
            `)
            .eq('status', 'accepted')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

        if (error) {
            console.error("Fetch Friends Error:", error)
            return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
        }

        // Map to return the *other* user in each friendship
        const friends = data.map(req => {
            if (req.requester_id === userId) {
                return req.addressee
            }
            return req.requester
        })

        return NextResponse.json(friends)

    } catch (error) {
        console.error("Friends List API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
