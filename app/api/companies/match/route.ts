import { createClient } from '@/lib/supabase/server';
import { calculateCompatibility } from '@/lib/matching';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { companyId } = await request.json();
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Company Info
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (companyError || !company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // 2. Fetch User Tech Stack
        // For now, we'll derive this from their repositories or a previous project analysis
        // In a real scenario, we'd aggregate their top languages and tools
        const { data: analyses } = await supabase
            .from('project_analyses')
            .select('ai_analysis')
            .limit(5); // Get recent projects

        const userStack = new Set<string>();
        analyses?.forEach(analysis => {
            const stack = (analysis.ai_analysis as any)?.techStack || [];
            stack.forEach((skill: string) => userStack.add(skill));
        });

        // 3. Calculate Compatibility
        const match = calculateCompatibility(Array.from(userStack), company.tech_stack);

        // 4. Store the Match
        const { data: storedMatch, error: matchError } = await supabase
            .from('company_matches')
            .upsert({
                user_id: user.id,
                company_id: companyId,
                compatibility_score: match.score,
                match_details: {
                    matchedSkills: match.matchedSkills,
                    missingSkills: match.missingSkills
                }
            })
            .select()
            .single();

        if (matchError) throw matchError;

        return NextResponse.json({ success: true, match: storedMatch });

    } catch (error) {
        console.error('Match error:', error);
        return NextResponse.json({ error: 'Failed to calculate match' }, { status: 500 });
    }
}
