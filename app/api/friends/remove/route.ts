import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { targetUserId } = await request.json()
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
        }

        // Delete the friendship (it could be stored as requester or addressee)
        const { error } = await supabase
            .from('friend_requests')
            .delete()
            .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)

        if (error) {
            console.error("Remove Friend Error:", error)
            return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Remove Friend API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
