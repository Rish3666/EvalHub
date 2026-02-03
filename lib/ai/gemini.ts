import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

interface ProjectData {
    title: string;
    description: string;
    techStack: string[];
    challenge: string;
    solution: string;
}

interface AnalysisResult {
    analysis: {
        complexity: "beginner" | "intermediate" | "advanced";
        strengths: string[];
        techAreas: string[];
        architectureNotes: string;
        qualityScore: number;
        adaptationScore: number;
        implementationEstimate: string;
        difficulty: "Easy" | "Medium" | "Hard";
        concerns: string[];
    };
    questions: Array<{
        id: number;
        question: string;
        expectedDepth: string;
        category: string;
    }>;
}

/**
 * Analyzes README content using Gemini 1.5 Flash
 * Generates project-specific technical questions
 */
export async function analyzeREADME(
    readme: string,
    projectData: ProjectData
): Promise<AnalysisResult> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        analysis: {
                            type: SchemaType.OBJECT,
                            properties: {
                                complexity: { type: SchemaType.STRING },
                                strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                techAreas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                architectureNotes: { type: SchemaType.STRING },
                                qualityScore: { type: SchemaType.NUMBER },
                                adaptationScore: { type: SchemaType.NUMBER },
                                implementationEstimate: { type: SchemaType.STRING },
                                difficulty: { type: SchemaType.STRING },
                                concerns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                            },
                            required: ["complexity", "strengths", "techAreas", "architectureNotes", "qualityScore", "adaptationScore", "implementationEstimate", "difficulty", "concerns"]
                        },
                        questions: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    id: { type: SchemaType.NUMBER },
                                    question: { type: SchemaType.STRING },
                                    expectedDepth: { type: SchemaType.STRING },
                                    category: { type: SchemaType.STRING }
                                },
                                required: ["id", "question", "expectedDepth", "category"]
                            }
                        }
                    },
                    required: ["analysis", "questions"]
                }
            }
        });

        const prompt = `You are an expert technical interviewer analyzing a developer's project.

Project Details:
- Title: ${projectData.title}
- Description: ${projectData.description}
- Tech Stack: ${projectData.techStack.join(", ")}
- Challenge Solved: ${projectData.challenge}
- Solution Approach: ${projectData.solution}

README Content (first 10000 chars):
${readme.slice(0, 10000)}

CRITICAL TASK:
1. Analyze the README to understand:
   - Project complexity (beginner/intermediate/advanced)
   - Architecture patterns used
   - Technical depth demonstrated
   - Problem-solving approach
   - Code organization hints
   - Quality Score (0-100) based on documentation and perceived structure
   - Adaptation Score (0-100) based on modularity and ease of use
   - Implementation Estimate (e.g. "2-4 weeks", "4-8 weeks")
   - Implementation Concerns (Specific technical risks or missing pieces)

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

Return valid JSON adhering to the specified schema.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Gemini Analysis API error:", error);
        throw new Error("Failed to analyze README with AI");
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
    aiAnalysis: AnalysisResult["analysis"];
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
 * Generates comprehensive skill scorecard using Gemini 1.5 Pro
 * Evaluates answers and provides detailed feedback
 */
export async function generateScorecard(
    context: ScorecardContext
): Promise<ScorecardResult> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        overallScore: { type: SchemaType.NUMBER },
                        skillBreakdown: {
                            type: SchemaType.OBJECT,
                            properties: {
                                technicalDepth: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        score: { type: SchemaType.NUMBER },
                                        level: { type: SchemaType.STRING },
                                        evidence: { type: SchemaType.STRING }
                                    },
                                    required: ["score", "level", "evidence"]
                                },
                                architecturalThinking: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        score: { type: SchemaType.NUMBER },
                                        level: { type: SchemaType.STRING },
                                        evidence: { type: SchemaType.STRING }
                                    },
                                    required: ["score", "level", "evidence"]
                                },
                                problemSolving: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        score: { type: SchemaType.NUMBER },
                                        level: { type: SchemaType.STRING },
                                        evidence: { type: SchemaType.STRING }
                                    },
                                    required: ["score", "level", "evidence"]
                                },
                                codeQuality: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        score: { type: SchemaType.NUMBER },
                                        level: { type: SchemaType.STRING },
                                        evidence: { type: SchemaType.STRING }
                                    },
                                    required: ["score", "level", "evidence"]
                                },
                                communicationClarity: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        score: { type: SchemaType.NUMBER },
                                        level: { type: SchemaType.STRING },
                                        evidence: { type: SchemaType.STRING }
                                    },
                                    required: ["score", "level", "evidence"]
                                }
                            },
                            required: ["technicalDepth", "architecturalThinking", "problemSolving", "codeQuality", "communicationClarity"]
                        },
                        technologiesYouKnow: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    name: { type: SchemaType.STRING },
                                    proficiency: { type: SchemaType.STRING },
                                    percentage: { type: SchemaType.NUMBER },
                                    evidence: { type: SchemaType.STRING }
                                },
                                required: ["name", "proficiency", "percentage", "evidence"]
                            }
                        },
                        skillGaps: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    skill: { type: SchemaType.STRING },
                                    reason: { type: SchemaType.STRING },
                                    priority: { type: SchemaType.STRING },
                                    learningPath: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            beginner: { type: SchemaType.STRING },
                                            intermediate: { type: SchemaType.STRING },
                                            projectIdea: { type: SchemaType.STRING }
                                        },
                                        required: ["beginner", "intermediate", "projectIdea"]
                                    }
                                },
                                required: ["skill", "reason", "priority", "learningPath"]
                            }
                        },
                        recommendedNextSteps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        areasForImprovement: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    },
                    required: [
                        "overallScore",
                        "skillBreakdown",
                        "technologiesYouKnow",
                        "skillGaps",
                        "recommendedNextSteps",
                        "strengths",
                        "areasForImprovement"
                    ]
                }
            }
        });

        const prompt = `You are an expert technical evaluator assessing a developer's project and interview answers.

Project Context:
- Title: ${context.project.title}
- Tech Stack: ${context.project.techStack.join(", ")}
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

Developer's Answer${qa.isSkipped ? " (SKIPPED)" : ""}:
${qa.answer || "No answer provided"}

Time Spent: ${qa.timeSpent}s
`
                )
                .join("\n---\n")}

CRITICAL TASK - Generate Comprehensive Skill Evaluation:

1. OVERALL SCORE (0-100):
   - Skipped questions: -20 points each
   - Shallow answers (< expected depth): -10 to -15 points
   - Good answers: +15 to +20 points
   - Exceptional answers (beyond expected): +25 points

2. SKILL BREAKDOWN (5 dimensions: technicalDepth, architecturalThinking, problemSolving, codeQuality, communicationClarity):
   - Each dimension scored 0-100.

3. TECHNOLOGY PROFICIENCY (for EACH tech in stack):
   - Proficiency level: Beginner/Intermediate/Advanced/Expert
   - Percentage: 0-100
   - Evidence: Specific quote/behavior from answers

4. SKILL GAPS (3-5 gaps):
   - Learning path: beginner → intermediate resources + project idea

Return valid JSON adhering to the specified schema.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Gemini Scorecard API error:", error);
        throw new Error("Failed to generate scorecard with AI");
    }
}

/**
 * Fallback questions when AI analysis fails
 */
export function getDefaultQuestions(techStack: string[]): AnalysisResult["questions"] {
    return [
        {
            id: 1,
            question: `Why did you choose ${techStack[0] || "this technology"} for this project? What alternatives did you consider?`,
            expectedDepth: "Should explain use case fit, team familiarity, ecosystem, and at least one alternative",
            category: "Technology Decisions",
        },
        {
            id: 2,
            question: "Describe the biggest technical challenge you faced and how you solved it.",
            expectedDepth: "Should explain problem context, attempted solutions, final approach, and trade-offs",
            category: "Problem Solving",
        },
        {
            id: 3,
            question: "How did you approach testing for this project? What testing strategies did you use?",
            expectedDepth: "Should cover unit tests, integration tests, E2E tests, and testing philosophy",
            category: "Testing & Quality",
        },
        {
            id: 4,
            question: "What performance optimizations did you implement or would you implement at scale?",
            expectedDepth: "Should discuss caching, database optimization, lazy loading, or other relevant techniques",
            category: "Performance",
        },
        {
            id: 5,
            question: "How did you handle security concerns in this project?",
            expectedDepth: "Should mention authentication, authorization, input validation, XSS/CSRF prevention",
            category: "Security",
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
        console.error("Gemini API error, using fallback:", error);
        return {
            analysis: {
                complexity: "intermediate",
                strengths: ["Well-structured project", "Clear documentation"],
                techAreas: projectData.techStack,
                architectureNotes: "Unable to analyze - using default questions",
                qualityScore: 50,
                adaptationScore: 50,
                implementationEstimate: "2-4 weeks",
                difficulty: "Medium",
                concerns: ["Limited README analysis available"],
            },
            questions: getDefaultQuestions(projectData.techStack),
        };
    }
}
