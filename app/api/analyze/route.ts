import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchReadme, fetchRepoStructure, fetchRepoStats, fetchRepoLanguages } from '@/lib/github'
import { generateProjectAnalysis } from '@/lib/gemini'

export async function POST(request: Request) {
    try {
        const { repoName, owner } = await request.json()
        const supabase = await createClient()

        // Get current session to retrieve the GitHub provider token
        const { data: { session } } = await supabase.auth.getSession()

        // Token is optional for public repos
        const token = session?.provider_token || null;

        // 1. Fetch Repo Metadata, Structure, README, and Languages
        const [structure, readme, stats, languages] = await Promise.all([
            fetchRepoStructure(owner, repoName, token),
            fetchReadme(owner, repoName, token),
            fetchRepoStats(owner, repoName, token),
            fetchRepoLanguages(owner, repoName, token)
        ])

        // 2. Perform AI Analysis
        const analysis = await generateProjectAnalysis(repoName, readme, structure, stats, languages)

        if (!analysis) {
            return NextResponse.json({ error: 'Failed to generate analysis.' }, { status: 500 })
        }

        return NextResponse.json(analysis)

    } catch (error: any) {
        console.error("Analysis API Error Details:", {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        })
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 })
    }
}
