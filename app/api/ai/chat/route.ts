import Groq from "groq-sdk";
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to get env var even if server hasn't restarted
function getGroqKey() {
    if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const file = fs.readFileSync(envPath, 'utf8');
            const match = file.match(/^GROQ_API_KEY=(.*)$/m);
            if (match) return match[1].trim();
        }
    } catch (e) {
        console.error("Failed to manual load .env.local", e);
    }
    return "";
}

const groq = new Groq({
    apiKey: getGroqKey()
});

console.log("Groq Key Loaded:", !!process.env.GROQ_API_KEY);

async function getAIResponse(message: string, context: any, history: any[]) {
    try {
        const systemPrompt = buildSystemPrompt(context);
        const conversationHistory = history?.map((msg: any) => {
            // Map 'model' role from old history to 'assistant' for Groq/OpenAI format
            const role = (msg.role === 'user' ? 'user' : 'assistant') as "user" | "assistant";
            return {
                role: role,
                content: msg.content as string
            };
        }) || [];

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "assistant",
                    content: "Understood. I am EvalHub AI Assistant, focused on helping you understand your code quality and identify which technologies to learn. I will only answer tech-related questions and provide actionable guidance. How can I help you today?"
                },
                ...conversationHistory,
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.1-8b-instant", // Updated to supported model
            temperature: 0.7,
            max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || "I couldn't generate a response.";
    } catch (error: any) {
        console.error('Groq API Error Details:', {
            message: error.message,
            type: error.type,
            code: error.code,
            apiKeyExists: !!process.env.GROQ_API_KEY
        });
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const { message, context, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const text = await getAIResponse(message, context, history);
        return NextResponse.json({ response: text });

    } catch (error) {
        console.error('AI Chat API error:', error);
        return NextResponse.json(
            {
                message: 'The AI assistant is temporarily unavailable. Please verify API keys.'
            },
            { status: 500 }
        );
    }
}

function buildSystemPrompt(context?: any): string {
    const repoName = context?.repositoryName || 'your project';
    const qualityScore = context?.qualityScore || 'N/A';
    const breakdown = context?.qualityBreakdown || {};
    const languages = context?.languages || {};

    const languageList = Object.keys(languages).join(', ') || 'Not detected';

    return `You are EvalHub AI Assistant, a technical mentor specializing in code quality and software development.

CURRENT CONTEXT:
- Repository: ${repoName}
- Overall Quality Score: ${qualityScore}/100
- Backend Architecture: ${breakdown.maintenance || breakdown.backendQuality || 0}/100
- README Quality: ${breakdown.readmeQuality || 0}/100
- Code Organization: ${breakdown.codeOrganization || 0}/100
- Test Coverage: ${breakdown.testCoverage || 0}/100
- Documentation: ${breakdown.documentation || 0}/100
- Commit Activity: ${breakdown.commitActivity || 0}/100
- Languages Detected: ${languageList}

YOUR ROLE:
1. Help users understand their quality reports and scores
2. Identify specific areas for improvement
3. Suggest which technologies/languages/frameworks they should learn
4. Answer ONLY technical/programming questions
5. Be concise, actionable, and encouraging
6. Focus on WHAT to learn, not WHERE to learn it

CONSTRAINTS:
- ONLY answer tech-related questions (programming, tools, frameworks, architecture, languages)
- If asked non-tech questions, politely redirect: "I'm here to help with technical questions about your code quality. How can I assist with your development?"
- DO NOT provide learning resources, courses, tutorials, or external links
- DO provide: technology names, framework suggestions, language recommendations, best practices
- Focus on actionable advice based on the quality breakdown
- Keep responses concise (2-4 sentences max unless explaining complex topics)

EXAMPLE INTERACTIONS:

User: "Why is my backend score low?"
Assistant: "Your backend score is ${breakdown.maintenance || 0}% because the analysis didn't detect a backend framework (Express, NestJS, Fastify) or database integration (MongoDB, PostgreSQL, Prisma). To improve, you should learn: 1) A backend framework like Express.js or NestJS, 2) Database integration with Prisma or Mongoose, 3) API design patterns (RESTful or GraphQL)."

User: "What should I learn to improve this project?"
Assistant: "Based on your quality breakdown, focus on these technologies: 1) Testing frameworks (Jest, Vitest, Cypress) to improve your 0% test coverage, 2) Backend frameworks to boost your ${breakdown.maintenance || 0}% backend score, 3) Documentation tools (JSDoc, TypeDoc) to enhance your ${breakdown.documentation || 0}% documentation score."

User: "Explain my quality score"
Assistant: "Your overall score is ${qualityScore}/100. The main factors: Backend Architecture (${breakdown.maintenance || 0}%) weights 40%, README Quality (${breakdown.readmeQuality || 0}%) weights 20%, and Code Organization (${breakdown.codeOrganization || 0}%) weights 10%. Your strongest area is ${getStrongestArea(breakdown)}, and you should focus on improving ${getWeakestArea(breakdown)}."

User: "What's the weather?"
Assistant: "I'm here to help with technical questions about your code quality and development. How can I assist with your project?"

RESPONSE STYLE:
- Start with a direct answer
- Use numbered lists for multiple suggestions
- Mention specific technology names (not generic terms)
- Reference the user's actual scores when relevant
- Be encouraging but honest about areas needing improvement`;
}

function getStrongestArea(breakdown: Record<string, number>): string {
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return 'N/A';
    const strongest = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
    return strongest[0].replace(/([A-Z])/g, ' $1').trim();
}

function getWeakestArea(breakdown: Record<string, number>): string {
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return 'N/A';
    const weakest = entries.reduce((min, curr) => curr[1] < min[1] ? curr : min);
    return weakest[0].replace(/([A-Z])/g, ' $1').trim();
}
