import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch followed communities with details
        const { data, error } = await supabase
            .from('community_follows')
            .select(`
        followed_at,
        community:communities (
          id,
          name,
          description,
          tags,
          created_at
        )
      `)
            .eq('user_id', session.user.id)
            .order('followed_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Extract just the community data
        const communities = data.map(item => item.community)

        return NextResponse.json(communities)
    } catch (error) {
        console.error('Fetch following error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
