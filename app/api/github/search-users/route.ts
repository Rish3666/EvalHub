import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json({ users: [] });
    }

    try {
        const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                // "Authorization": `token ${process.env.GITHUB_TOKEN}` // Optional
            }
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.message || "Failed to search users" }, { status: response.status });
        }

        const data = await response.json();
        const users = data.items.map((user: any) => ({
            login: user.login,
            avatar_url: user.avatar_url,
        }));

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error("GitHub search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
