import { NextResponse } from 'next/server'
import { generateTechStackRecommendation } from '@/lib/gemini'

export async function POST(request: Request) {
    try {
        const { goal, preferences } = await request.json()

        // Validate input
        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
        }

        // Perform AI Analysis
        const recommendation = await generateTechStackRecommendation(goal, preferences || "")

        if (!recommendation) {
            return NextResponse.json({ error: 'Failed to generate recommendation.' }, { status: 500 })
        }

        return NextResponse.json(recommendation)

    } catch (error) {
        console.error("Recommendation API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
