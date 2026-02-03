import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const repoIdsParam = searchParams.get('repoIds')

        if (!repoIdsParam) {
            return NextResponse.json({ error: 'Missing repoIds' }, { status: 400 })
        }

        const repoIds = repoIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))

        if (repoIds.length === 0) {
            return NextResponse.json({})
        }

        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id

        // Fetch Likes Counts
        const { data: likesData, error: likesError } = await supabase
            .from('feed_likes')
            .select('repo_id')
            .in('repo_id', repoIds)

        // Fetch Comments Counts
        const { data: commentsData, error: commentsError } = await supabase
            .from('feed_comments')
            .select('repo_id')
            .in('repo_id', repoIds)

        // Fetch "Liked By Me"
        let likedByMe: number[] = []
        if (userId) {
            const { data: myLikes } = await supabase
                .from('feed_likes')
                .select('repo_id')
                .eq('user_id', userId)
                .in('repo_id', repoIds)

            if (myLikes) {
                likedByMe = myLikes.map(l => l.repo_id)
            }
        }

        if (likesError || commentsError) {
            console.error("Error fetching interactions", { likesError, commentsError })
            return NextResponse.json({ error: 'DB Error' }, { status: 500 })
        }

        // Aggregate
        const result: Record<number, { likes: number, comments: number, likedByMe: boolean }> = {}

        repoIds.forEach(id => {
            result[id] = {
                likes: likesData?.filter(d => d.repo_id === id).length || 0,
                comments: commentsData?.filter(d => d.repo_id === id).length || 0,
                likedByMe: likedByMe.includes(id)
            }
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error("Interactions API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
