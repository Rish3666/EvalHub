import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                // "Authorization": `token ${process.env.GITHUB_TOKEN}` // Optional: if we add a token later
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (response.status === 404) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.message || "Failed to fetch repositories" }, { status: response.status });
        }

        const repos = await response.json();

        // Filter and map to a clean format
        const formattedRepos = repos
            .filter((repo: any) => !repo.fork) // Usually users want to analyze their own work
            .map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                html_url: repo.html_url,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                updated_at: repo.updated_at,
            }));

        return NextResponse.json(formattedRepos);
    } catch (error: any) {
        console.error("GitHub API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
