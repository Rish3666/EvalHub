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

        const requesterId = session.user.id

        if (requesterId === targetUserId) {
            return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
        }

        // Check if request already exists
        const { data: existing, error: checkError } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${requesterId})`)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Request already exists or you are already friends' }, { status: 400 })
        }

        // Create new request
        const { error: insertError } = await supabase
            .from('friend_requests')
            .insert({
                requester_id: requesterId,
                addressee_id: targetUserId,
                status: 'pending'
            })

        if (insertError) {
            console.error("Insert Error:", insertError)
            return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Friend Request Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
