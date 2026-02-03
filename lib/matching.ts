/**
 * Logic to calculate compatibility between a user's tech stack and a company's requirements.
 */

export interface MatchResult {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
}

export function calculateCompatibility(userStack: string[], companyStack: string[]): MatchResult {
    if (!companyStack.length) return { score: 100, matchedSkills: [], missingSkills: [] };

    const matchedSkills = companyStack.filter(skill =>
        userStack.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
    );

    const missingSkills = companyStack.filter(skill =>
        !userStack.some(userSkill => userSkill.toLowerCase() === skill.toLowerCase())
    );

    // Weighted score calculation
    // Base score is (matches / total_required) * 100
    const rawScore = (matchedSkills.length / companyStack.length) * 100;

    return {
        score: Math.round(rawScore),
        matchedSkills,
        missingSkills
    };
}
