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

        // Fetch accepted friend requests AND filter for online/recently active
        const { data, error } = await supabase
            .from('friend_requests')
            .select(`
                requester:users!friend_requests_requester_id_fkey (id, username, avatar_url, full_name, github_username, online_status, last_seen),
                addressee:users!friend_requests_addressee_id_fkey (id, username, avatar_url, full_name, github_username, online_status, last_seen)
            `)
            .eq('status', 'accepted')
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Map and filter for active friends
        const activeFriends = data.map(req => {
            const friend = (req.requester as any).id === userId ? req.addressee : req.requester
            return friend as any
        }).filter(friend => {
            // Check if online or active in last 5 minutes
            const isOnline = friend.online_status === 'online'
            const lastSeen = new Date(friend.last_seen).getTime()
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
            const isRecentlyActive = lastSeen > fiveMinutesAgo

            return isOnline || isRecentlyActive
        })

        return NextResponse.json(activeFriends)

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
