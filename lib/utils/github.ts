/**
 * Fetches README.md content from a GitHub repository
 * Tries multiple branch names (main, master, develop)
 * @param repoUrl - Full GitHub repository URL
 * @returns README content as string, or null if not found
 */
export async function fetchREADME(repoUrl: string): Promise<string | null> {
    try {
        // Parse GitHub URL to extract owner and repo
        const urlParts = repoUrl.replace(/\.git$/, '').split('/');
        const owner = urlParts[urlParts.length - 2];
        const repo = urlParts[urlParts.length - 1];

        if (!owner || !repo) {
            throw new Error('Invalid GitHub URL format');
        }

        // Try common branch names
        const branches = ['main', 'master', 'develop'];

        for (const branch of branches) {
            try {
                const response = await fetch(
                    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
                    {
                        headers: {
                            'User-Agent': 'DevShowcase-AI-Analyzer',
                            ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
                        },
                        // Add timeout
                        signal: AbortSignal.timeout(10000), // 10 second timeout
                    }
                );

                if (response.ok) {
                    const content = await response.text();
                    return content;
                }
            } catch (branchError) {
                // Continue to next branch
                continue;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching README:', error);
        return null;
    }
}

/**
 * Fetches repository metadata from GitHub
 */
export async function fetchRepoMetadata(repoUrl: string): Promise<any | null> {
    try {
        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) return null;

        const { owner, repo } = parsed;
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevShowcase-AI-Analyzer',
                ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching repo metadata:', error);
        return null;
    }
}

/**
 * Fetches repository language breakdown from GitHub
 */
export async function fetchRepoLanguages(repoUrl: string): Promise<Record<string, number> | null> {
    try {
        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) return null;

        const { owner, repo } = parsed;
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevShowcase-AI-Analyzer',
                ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching repo languages:', error);
        return null;
    }
}

/**
 * Validates if a URL is a valid GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubPattern.test(url.replace(/\.git$/, ''));
}

/**
 * Extracts owner and repo name from GitHub URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    try {
        // Handle both https://github.com/owner/repo and github.com/owner/repo
        const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
        const parts = cleanUrl.split('/');

        if (parts.length < 2) return null;

        const owner = parts[parts.length - 2];
        const repo = parts[parts.length - 1];

        if (!owner || !repo) return null;

        return { owner, repo };
    } catch {
        return null;
    }
}
