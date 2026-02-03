import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchReadme, fetchRepoStructure } from '@/lib/github'
import { generateProjectAnalysis } from '@/lib/gemini'

export async function POST(request: Request) {
    try {
        const { repoName, owner } = await request.json()
        const supabase = await createClient()

        // Get current session to retrieve the GitHub provider token
        const { data: { session } } = await supabase.auth.getSession()

        if (!session || !session.provider_token) {
            // Fallback: If provider_token is missing in session (common in some Supabase configs),
            // we might need to rely on the user providing it or re-authenticating.
            // For now, return 401.
            return NextResponse.json({ error: 'GitHub Access Token not found. Please sign out and sign in again.' }, { status: 401 })
        }

        const token = session.provider_token;

        // 1. Fetch Repo Metadata
        const [structure, readme] = await Promise.all([
            fetchRepoStructure(owner, repoName, token),
            fetchReadme(owner, repoName, token)
        ])

        // 2. Perform AI Analysis
        const analysis = await generateProjectAnalysis(repoName, readme, structure)

        if (!analysis) {
            return NextResponse.json({ error: 'Failed to generate analysis.' }, { status: 500 })
        }

        return NextResponse.json(analysis)

    } catch (error) {
        console.error("Analysis API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
