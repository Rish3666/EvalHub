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
/**
 * Deterministically generates analysis based on quality scores ("Hard Indexing")
 */
function generateHardIndexedAnalysis(projectData: ProjectData, scores: any): AnalysisResult {
    const questions: AnalysisResult["questions"] = [];
    const concerns: string[] = [];
    const strengths: string[] = [];
    let architectureNotes = "";

    // 1. Backend Analysis
    if (scores.maintenance < 30) {
        concerns.push("Missing backend framework");
        questions.push({
            id: 1,
            question: "This project seems to lack a robust backend framework. how would you scale this architecture to handle 10,000 concurrent users?",
            expectedDepth: "Candidate should discuss introducing a framework like NestJS/Express, database connection pooling, and caching strategies.",
            category: "Scalability"
        });
        architectureNotes += "• Backend architecture appears minimal. Recommend adopting a structured framework (NestJS/Express) for scalability.\n";
    } else {
        strengths.push("Solid backend structure");
        questions.push({
            id: 1,
            question: "Walk me through your backend architecture decisions. Why did you choose this specific structure over a microservices approach?",
            expectedDepth: "Candidate should explain the trade-offs between monolith and microservices, citing complexity vs. scalability.",
            category: "Architecture"
        });
        architectureNotes += "• Backend structure is well-defined. Good separation of concerns detected.\n";
    }

    // 2. Testing Analysis
    if (scores.testCoverage < 20) {
        concerns.push("Critical lack of testing");
        questions.push({
            id: 2,
            question: "I notice there are few automated tests. How do you ensure new features don't break existing functionality in production?",
            expectedDepth: "Candidate should acknowledge the risk and propose a testing strategy (Unit, Integration, E2E) with tools like Jest/Cypress.",
            category: "Reliability"
        });
        architectureNotes += "• Critical Alert: Test coverage is insufficient. Immediate focus on unit testing is recommended.\n";
    } else {
        strengths.push("Comprehensive testing");
        questions.push({
            id: 2,
            question: "Your test coverage is good. Can you describe a complex bug that your test suite caught before deployment?",
            expectedDepth: "Candidate should provide a concrete example demonstrating the value of their testing strategy.",
            category: "Quality Assurance"
        });
        architectureNotes += "• Testing strategy is robust. Project reliability is high.\n";
    }

    // 3. Documentation Analysis
    if (scores.documentation < 40) {
        concerns.push("Sparse documentation");
        questions.push({
            id: 3,
            question: "The documentation is brief. If a new developer joined today, what would be their biggest hurdle in understanding this codebase?",
            expectedDepth: "Candidate should identify complex logic or setup steps that need better documentation.",
            category: "Maintainability"
        });
    } else {
        strengths.push("Excellent documentation");
        questions.push({
            id: 3,
            question: "Your documentation is very clear. How do you keep it up-to-date as the codebase evolves?",
            expectedDepth: "Candidate should discuss processes like 'docs-as-code' or automated documentation generation.",
            category: "Process"
        });
    }

    // 4. Tech Stack Specific (Hard Indexed)
    const techStack = projectData.techStack.join(" ").toLowerCase();

    if (techStack.includes("react") || techStack.includes("next")) {
        questions.push({
            id: 4,
            question: "In this React/Next.js application, how are you managing global state and preventing unnecessary re-renders?",
            expectedDepth: "Candidate should discuss Context API, Redux/Zustand, or memoization techniques (useMemo, useCallback).",
            category: "Frontend Performance"
        });
    } else if (techStack.includes("python") || techStack.includes("django") || techStack.includes("fastapi")) {
        questions.push({
            id: 4,
            question: "For this Python backend, how are you handling asynchronous tasks and database migrations?",
            expectedDepth: "Candidate should mention Celery/Redis for async tasks and Alembic/Django Migrations for DB schema management.",
            category: "Backend Operations"
        });
    } else {
        questions.push({
            id: 4,
            question: "What was the most technically challenging part of implementing this specific tech stack?",
            expectedDepth: "Candidate should detailed specific language/framework hurdles and solutions.",
            category: "Technical Depth"
        });
    }

    // 5. System Design / Security
    questions.push({
        id: 5,
        question: "If this application were attacked (DDoS or Injection), which component would fail first and how would you secure it?",
        expectedDepth: "Candidate should identify the weakest link (e.g. un-rate-limited API) and propose security measures (Rate Limiting, WAF, Input Validation).",
        category: "Security & Resilience"
    });

    return {
        analysis: {
            complexity: scores.qualityScore > 70 ? "advanced" : scores.qualityScore > 40 ? "intermediate" : "beginner",
            strengths: strengths.length > 0 ? strengths : ["Potential for growth", "Clear basic structure"],
            techAreas: projectData.techStack,
            architectureNotes: `### 🔍 AI Architectural Analysis (Hard Indexed)
            
${architectureNotes}
• **Code Organization:** ${scores.codeOrganization > 60 ? "Modular and clean." : "Needs better folder structure separation."}
• **Adaptability:** This codebase is ${scores.adaptationScore > 70 ? "highly adaptable" : "somewhat rigid"} based on current patterns.
• **Recommendation:** Focus on ${scores.testCoverage < 30 ? "testing strategies" : scores.maintenance < 40 ? "backend architecture" : "documentation"} to improve quality.`,
            qualityScore: scores.qualityScore,
            adaptationScore: scores.adaptationScore || 50,
            implementationEstimate: scores.qualityScore > 70 ? "4-8 weeks" : scores.qualityScore > 40 ? "2-4 weeks" : "1 week",
            difficulty: scores.qualityScore > 70 ? "Hard" : scores.qualityScore > 40 ? "Medium" : "Easy",
            concerns: concerns.length > 0 ? concerns : ["Minor refactoring needed"],
        },
        questions: questions
    };
}

/**
 * Wrapper with fallback for README analysis
 * Now uses "Hard Indexing" (deterministic logic) when scores are available
 */
export async function analyzeREADMEWithFallback(
    readme: string,
    projectData: ProjectData,
    calculatedScores?: any // Pass the calculated scores here
): Promise<AnalysisResult> {

    // IF we have scores (Hard Indexing Mode), prioritize deterministic analysis
    if (calculatedScores) {
        // console.log("Using Hard Indexed Logic for Analysis");
        return generateHardIndexedAnalysis(projectData, calculatedScores);
    }

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
