import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface ProjectAnalysis {
  techStack: string[];
  complexity: "Beginner" | "Intermediate" | "Advanced";
  completeness: number; // 0-100
  scoreCard: {
    cleanCode: number;
    architecture: number;
    bestPractices: number;
  };
  interviewQuestions: {
    question: string;
    context: string; // Why this question was asked based on the code
    difficulty: "Easy" | "Medium" | "Hard";
  }[];
}

export interface TechStackRecommendation {
  recommendedStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    tools?: string[];
  };
  explanation: string;
  installCommands: string[];
  resources: {
    title: string;
    url: string;
    type: "Course" | "Documentation" | "Tutorial";
  }[];
}

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateProjectAnalysis(
  repoName: string,
  readmeContent: string,
  fileStructure: string,
  stats: any,
  languages: any
): Promise<ProjectAnalysis | null> {
  if (!apiKey) return null;

  const prompt = `
    Analyze the following GitHub repository project.
    Repo Name: ${repoName}
    Stats: ${JSON.stringify(stats)}
    Languages: ${JSON.stringify(languages)}
    File Structure: ${fileStructure.slice(0, 1000)}...
    README Snippet: ${readmeContent.slice(0, 2000)}...

    Act as a Senior Principal Engineer conducting a technical interview.
    1. Identify the tech stack and primary language focus based on language bytes.
    2. Assess the complexity and completeness (0-100). Consider stars/forks/activity in stats.
    3. Generate a "Score Card" (Clean Code, Architecture, Best Practices) from 0-100.
    4. Generate 3-5 specific technical interview questions based on the ACTUAL code structure and tech stack detected. Explain the context for each question.

    Respond ONLY in valid JSON format matching this interface:
    {
      "techStack": ["string"],
      "complexity": "Beginner" | "Intermediate" | "Advanced",
      "completeness": number,
      "scoreCard": { "cleanCode": number, "architecture": number, "bestPractices": number },
      "interviewQuestions": [
        { "question": "string", "context": "string", "difficulty": "Easy" | "Medium" | "Hard" }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up markdown code blocks if present
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson) as ProjectAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

export async function generateTechStackRecommendation(goal: string, preferences: string): Promise<TechStackRecommendation | null> {
  if (!apiKey) return null;

  const prompt = `
    Act as a DevRel Expert. The user wants to build: "${goal}".
    Preferences: "${preferences}".

    Recommend the best modern tech stack for this specific goal.
    Provide 'npm install' commands to kickstart the project.
    List 3 high-quality learning resources (mix of docs and tutorials).

    Respond ONLY in valid JSON format matching this interface:
    {
      "recommendedStack": { "frontend": "string", "backend": "string", "database": "string", "tools": ["string"] },
      "explanation": "string",
      "installCommands": ["string"],
      "resources": [
        { "title": "string", "url": "string", "type": "Course" | "Documentation" | "Tutorial" }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson) as TechStackRecommendation;
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return null;
  }
}
