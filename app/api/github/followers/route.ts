import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.provider_token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const res = await fetch('https://api.github.com/user/followers', {
            headers: {
                Authorization: `Bearer ${session.provider_token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        })

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch followers' }, { status: res.status })
        }

        const followers = await res.json()
        return NextResponse.json(followers)

    } catch (error) {
        console.error('Followers API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
