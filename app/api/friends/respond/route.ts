import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { requestId, action } = await request.json()
        const supabase = await createClient()

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!['accepted', 'declined'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Verify the request belongs to the current user (as addressee)
        const { data: requestData, error: fetchError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (fetchError || !requestData) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        if (requestData.addressee_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Update status
        const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: action, updated_at: new Date().toISOString() })
            .eq('id', requestId)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
        }

        return NextResponse.json({ success: true, status: action })

    } catch (error) {
        console.error("Friend Respond Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
