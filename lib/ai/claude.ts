import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ProjectData {
    title: string;
    description: string;
    techStack: string[];
    challenge: string;
    solution: string;
}

interface AnalysisResult {
    analysis: {
        complexity: 'beginner' | 'intermediate' | 'advanced';
        strengths: string[];
        techAreas: string[];
        architectureNotes: string;
    };
    questions: Array<{
        id: number;
        question: string;
        expectedDepth: string;
        category: string;
    }>;
}

/**
 * Analyzes README content using Claude Sonnet 4.5 with extended thinking
 * Generates project-specific technical questions
 */
export async function analyzeREADME(
    readme: string,
    projectData: ProjectData
): Promise<AnalysisResult> {
    try {
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            temperature: 1,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert technical interviewer analyzing a developer's project.

Project Details:
- Title: ${projectData.title}
- Description: ${projectData.description}
- Tech Stack: ${projectData.techStack.join(', ')}
- Challenge Solved: ${projectData.challenge}
- Solution Approach: ${projectData.solution}

README Content (first 8000 chars):
${readme.slice(0, 8000)}

CRITICAL TASK:
1. Analyze the README to understand:
   - Project complexity (beginner/intermediate/advanced)
   - Architecture patterns used
   - Technical depth demonstrated
   - Problem-solving approach
   - Code organization hints

2. Generate EXACTLY 5 questions that:
   - Are SPECIFIC to THIS project (not generic like "Why did you use React?")
   - Test DEEP understanding (architecture, trade-offs, scaling, edge cases)
   - Cover different aspects: design decisions, challenges, testing, optimization
   - Range from intermediate to advanced difficulty
   - Cannot be answered by someone who just read the README

3. Each question should have:
   - Clear, specific question text
   - Expected depth of answer (what a good answer covers)
   - Category (Architecture/Problem-Solving/Testing/Performance/Security)

Return ONLY valid JSON (no markdown, no explanation):
{
  "analysis": {
    "complexity": "beginner|intermediate|advanced",
    "strengths": ["strength1", "strength2", "strength3"],
    "techAreas": ["area1", "area2", "area3"],
    "architectureNotes": "Brief analysis of technical decisions visible in README"
  },
  "questions": [
    {
      "id": 1,
      "question": "Your README mentions using Redis for caching. Why did you choose Redis over in-memory caching or CDN edge caching for this specific use case?",
      "expectedDepth": "Should explain Redis persistence, data structure support, TTL management, and why it fits their traffic patterns better than alternatives",
      "category": "Architecture Decisions"
    }
  ]
}`,
                },
            ],
        });

        // Extract text content
        const textContent = message.content.find((block) => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response from Claude');
        }

        // Parse JSON response
        const result = JSON.parse(textContent.text);
        return result;
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to analyze README with AI');
    }
}

interface QuestionAnswer {
    question: string;
    expectedDepth: string;
    category: string;
    answer: string;
    isSkipped: boolean;
    timeSpent: number;
}

interface ScorecardContext {
    project: ProjectData;
    aiAnalysis: AnalysisResult['analysis'];
    questionsAndAnswers: QuestionAnswer[];
}

interface ScorecardResult {
    overallScore: number;
    skillBreakdown: Record<
        string,
        { score: number; level: string; evidence: string }
    >;
    technologiesYouKnow: Array<{
        name: string;
        proficiency: string;
        percentage: number;
        evidence: string;
    }>;
    skillGaps: Array<{
        skill: string;
        reason: string;
        priority: string;
        learningPath: {
            beginner: string;
            intermediate: string;
            projectIdea: string;
        };
    }>;
    recommendedNextSteps: string[];
    strengths: string[];
    areasForImprovement: string[];
}

/**
 * Generates comprehensive skill scorecard using Claude Sonnet 4.5
 * Evaluates answers and provides detailed feedback
 */
export async function generateScorecard(
    context: ScorecardContext
): Promise<ScorecardResult> {
    try {
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10000,
            temperature: 1,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert technical evaluator assessing a developer's project and interview answers.

Project Context:
- Title: ${context.project.title}
- Tech Stack: ${context.project.techStack.join(', ')}
- Challenge: ${context.project.challenge}
- Solution: ${context.project.solution}

Initial AI Analysis:
${JSON.stringify(context.aiAnalysis, null, 2)}

Interview Q&A:
${context.questionsAndAnswers
                            .map(
                                (qa, idx) => `
Question ${idx + 1} [${qa.category}]:
${qa.question}

Expected Depth:
${qa.expectedDepth}

Developer's Answer${qa.isSkipped ? ' (SKIPPED)' : ''}:
${qa.answer || 'No answer provided'}

Time Spent: ${qa.timeSpent}s
`
                            )
                            .join('\n---\n')}

CRITICAL TASK - Generate Comprehensive Skill Evaluation:

1. OVERALL SCORE (0-100):
   - Skipped questions: -20 points each
   - Shallow answers (< expected depth): -10 to -15 points
   - Good answers: +15 to +20 points
   - Exceptional answers (beyond expected): +25 points

2. SKILL BREAKDOWN (5 dimensions, each 0-100):
   - Technical Depth: Understanding of tech stack, algorithms, patterns
   - Architectural Thinking: System design, scalability, trade-offs
   - Problem Solving: Debugging approach, creative solutions
   - Code Quality: Testing, documentation, best practices
   - Communication: Clarity, structure, explanation ability

3. TECHNOLOGY PROFICIENCY (for EACH tech in stack):
   - Proficiency level: Beginner/Intermediate/Advanced/Expert
   - Percentage: 0-100
   - Evidence: Specific quote/behavior from answers

4. SKILL GAPS (3-5 gaps):
   - What's missing
   - Why it matters for this project type
   - Priority: High/Medium/Low
   - Learning path: beginner → intermediate resources + project idea

5. STRENGTHS & IMPROVEMENTS (3-4 each)

6. RECOMMENDED NEXT STEPS (3-5 concrete actions)

Return ONLY valid JSON:
{
  "overallScore": 85,
  "skillBreakdown": {
    "technicalDepth": { "score": 90, "level": "Advanced", "evidence": "..." },
    "architecturalThinking": { "score": 80, "level": "Intermediate-Advanced", "evidence": "..." },
    "problemSolving": { "score": 85, "level": "Advanced", "evidence": "..." },
    "codeQuality": { "score": 75, "level": "Intermediate", "evidence": "..." },
    "communicationClarity": { "score": 88, "level": "Advanced", "evidence": "..." }
  },
  "technologiesYouKnow": [
    {
      "name": "Next.js",
      "proficiency": "Advanced",
      "percentage": 85,
      "evidence": "Demonstrated strong understanding of App Router, Server Components, and RSC patterns"
    }
  ],
  "skillGaps": [
    {
      "skill": "Testing & TDD",
      "reason": "No mention of testing strategy; critical for production apps",
      "priority": "High",
      "learningPath": {
        "beginner": "Jest documentation + React Testing Library basics",
        "intermediate": "Integration testing with MSW + E2E with Playwright",
        "projectIdea": "Add 80% test coverage to this project with unit + integration tests"
      }
    }
  ],
  "recommendedNextSteps": [
    "Implement comprehensive test suite (Jest + RTL + Playwright)",
    "Add Redis caching layer for API responses",
    "Set up CI/CD pipeline with GitHub Actions"
  ],
  "strengths": [
    "Strong understanding of modern React patterns",
    "Clear architectural thinking",
    "Good communication of technical decisions"
  ],
  "areasForImprovement": [
    "Testing practices and TDD workflow",
    "Performance optimization techniques",
    "Security best practices (input validation, XSS prevention)"
  ]
}`,
                },
            ],
        });

        const textContent = message.content.find((block) => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text response from Claude');
        }

        const result = JSON.parse(textContent.text);
        return result;
    } catch (error) {
        console.error('Scorecard generation error:', error);
        throw new Error('Failed to generate scorecard with AI');
    }
}

/**
 * Fallback questions when AI analysis fails
 */
export function getDefaultQuestions(techStack: string[]): AnalysisResult['questions'] {
    return [
        {
            id: 1,
            question: `Why did you choose ${techStack[0] || 'this technology'} for this project? What alternatives did you consider?`,
            expectedDepth:
                'Should explain use case fit, team familiarity, ecosystem, and at least one alternative',
            category: 'Technology Decisions',
        },
        {
            id: 2,
            question:
                'Describe the biggest technical challenge you faced and how you solved it.',
            expectedDepth:
                'Should explain problem context, attempted solutions, final approach, and trade-offs',
            category: 'Problem Solving',
        },
        {
            id: 3,
            question:
                'How did you approach testing for this project? What testing strategies did you use?',
            expectedDepth:
                'Should cover unit tests, integration tests, E2E tests, and testing philosophy',
            category: 'Testing & Quality',
        },
        {
            id: 4,
            question:
                'What performance optimizations did you implement or would you implement at scale?',
            expectedDepth:
                'Should discuss caching, database optimization, lazy loading, or other relevant techniques',
            category: 'Performance',
        },
        {
            id: 5,
            question:
                'How did you handle security concerns in this project?',
            expectedDepth:
                'Should mention authentication, authorization, input validation, XSS/CSRF prevention',
            category: 'Security',
        },
    ];
}

/**
 * Wrapper with fallback for README analysis
 */
export async function analyzeREADMEWithFallback(
    readme: string,
    projectData: ProjectData
): Promise<AnalysisResult> {
    try {
        return await analyzeREADME(readme, projectData);
    } catch (error) {
        console.error('Claude API error, using fallback:', error);

        // Fallback: Use rule-based questions if AI fails
        return {
            analysis: {
                complexity: 'intermediate',
                strengths: ['Well-structured project', 'Clear documentation'],
                techAreas: projectData.techStack,
                architectureNotes: 'Unable to analyze - using default questions',
            },
            questions: getDefaultQuestions(projectData.techStack),
        };
    }
}
