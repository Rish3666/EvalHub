import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const repoId = searchParams.get('repoId')

        if (!repoId) {
            return NextResponse.json({ error: 'Repo ID required' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: comments, error } = await supabase
            .from('feed_comments')
            .select(`
                id,
                content,
                created_at,
                user:users (
                    id,
                    full_name,
                    avatar_url,
                    github_username
                )
            `)
            .eq('repo_id', repoId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Fetch Comments Error:", error)
            return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
        }

        return NextResponse.json(comments)

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { repoId, content } = await request.json()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('feed_comments')
            .insert({
                repo_id: repoId,
                user_id: user.id,
                content: content.trim()
            })
            .select(`
                id,
                content,
                created_at,
                user:users (
                    id,
                    full_name,
                    avatar_url,
                    github_username
                )
            `)
            .single()

        if (error) {
            console.error("Comment Insert Error:", error)
            return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
        }

        return NextResponse.json(data)

    } catch (error) {
        console.error("Comment API Error", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
