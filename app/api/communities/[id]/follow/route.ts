import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if already following
        const { data: existing } = await supabase
            .from('community_follows')
            .select('id')
            .eq('user_id', user.id)
            .eq('community_id', id)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Already following' }, { status: 400 })
        }

        // Follow the community
        const { error } = await supabase
            .from('community_follows')
            .insert({
                user_id: user.id,
                community_id: id
            })

        if (error) {
            console.error('Follow error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Follow error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Unfollow the community
        const { error } = await supabase
            .from('community_follows')
            .delete()
            .eq('user_id', user.id)
            .eq('community_id', id)

        if (error) {
            console.error('Unfollow error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unfollow error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
