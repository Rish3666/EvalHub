import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const username = searchParams.get('username')
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        const url = username
            ? `https://api.github.com/users/${encodeURIComponent(username)}/followers`
            : 'https://api.github.com/user/followers'

        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json'
        }

        // Use provider token if available (only for current user's profile usually)
        if (session?.provider_token && !username) {
            headers['Authorization'] = `Bearer ${session.provider_token}`
        } else if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
        }

        const res = await fetch(url, { headers })

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
