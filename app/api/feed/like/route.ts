import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { repoId } = await request.json()
        const supabase = await createClient()

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Check if already liked
        const { data: existing } = await supabase
            .from('feed_likes')
            .select('id')
            .eq('repo_id', repoId)
            .eq('user_id', userId)
            .maybeSingle()

        if (existing) {
            // Unlike
            await supabase
                .from('feed_likes')
                .delete()
                .eq('id', existing.id)
            return NextResponse.json({ liked: false })
        } else {
            // Like
            await supabase
                .from('feed_likes')
                .insert({
                    repo_id: repoId,
                    user_id: userId
                })
            return NextResponse.json({ liked: true })
        }

    } catch (error) {
        console.error("Like API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
