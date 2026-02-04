import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    try {
        // Fetch User Profile
        const userResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                ...(process.env.GITHUB_TOKEN && { "Authorization": `token ${process.env.GITHUB_TOKEN}` })
            },
            next: { revalidate: 3600 }
        });

        if (userResponse.status === 404) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!userResponse.ok) {
            const error = await userResponse.json();
            return NextResponse.json({ error: error.message || "Failed to fetch user data" }, { status: userResponse.status });
        }

        const userData = await userResponse.json();

        return NextResponse.json({
            login: userData.login,
            avatar_url: userData.avatar_url,
            html_url: userData.html_url,
            public_repos: userData.public_repos,
            followers: userData.followers,
            following: userData.following,
            created_at: userData.created_at,
            name: userData.name,
            bio: userData.bio,
            location: userData.location
        });
    } catch (error: any) {
        console.error("GitHub API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
