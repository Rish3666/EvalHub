const GITHUB_API_BASE = "https://api.github.com";

interface GitHubTreeItem {
    path: string;
    type: "blob" | "tree";
}

export async function fetchRepoStructure(owner: string, repo: string, token: string | null): Promise<string> {
    try {
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        // 1. Fetch repository data to get the default branch
        const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!repoResponse.ok) {
            console.error("GitHub Repo Metadata Error:", await repoResponse.text());
            return "Could not fetch repository metadata.";
        }

        const repoData = await repoResponse.json();
        const defaultBranch = repoData.default_branch || 'main'; // Fallback to 'main' just in case

        // 2. Fetch the tree recursively using the default branch
        const treeResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!treeResponse.ok) {
            return "Could not fetch repository structure.";
        }

        const data = await treeResponse.json();
        return formatTree(data.tree);
    } catch (error) {
        console.error("GitHub Tree Error:", error);
        return "Error fetching repository structure.";
    }
}

function formatTree(tree: GitHubTreeItem[]): string {
    // limit to top 200 files to save tokens and avoid noise
    return tree
        .filter(item => !item.path.startsWith('.') && !item.path.includes('node_modules') && !item.path.includes('dist'))
        .slice(0, 200)
        .map(item => item.path)
        .join("\n");
}

export async function fetchReadme(owner: string, repo: string, token: string | null): Promise<string> {
    try {
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3.raw",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!response.ok) return "No README.md found.";
        return await response.text();
    } catch (error) {
        console.error("GitHub README Error:", error);
        return "Error fetching README.";
    }
}

export async function fetchUserRepos(token: string) {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=10`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        return [];
    }
}

export async function fetchPublicRepos(username: string, token: string) {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=10`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            // If user not found or error, return empty
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch Public Repos Error:", error);
        return [];
    }
}

export async function fetchRepoStats(owner: string, repo: string, token: string | null) {
    try {
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
        };
        if (token) {
            headers.Authorization = `Bearer \${token}`;
        }

        const response = await fetch(`\${GITHUB_API_BASE}/repos/\${owner}/\${repo}`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("GitHub Stats Error:", error);
        return null;
    }
}

export async function fetchRepoLanguages(owner: string, repo: string, token: string | null) {
    try {
        const headers: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
        };
        if (token) {
            headers.Authorization = `Bearer \${token}`;
        }

        const response = await fetch(`\${GITHUB_API_BASE}/repos/\${owner}/\${repo}/languages`, {
            headers,
            next: { revalidate: 60 }
        });

        if (!response.ok) return {};
        return await response.json();
    } catch (error) {
        console.error("GitHub Languages Error:", error);
        return {};
    }
}
