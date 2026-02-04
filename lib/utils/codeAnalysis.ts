/**
 * Enhanced Code Analysis Utilities
 * Provides deep repository analysis using GitHub API with PAT
 */

interface RepoAnalysisResult {
    qualityScore: number;
    complexity: string;
    readmeQuality: number;
    codeOrganization: number;
    testCoverage: number;
    documentation: number;
    commitActivity: number;
    communityEngagement: number;
    maintenance: number;
    details: {
        hasTests: boolean;
        hasCI: boolean;
        hasLinting: boolean;
        hasDocs: boolean;
        fileCount: number;
        directoryStructure: string[];
        languages: Record<string, number>;
    };
}

/**
 * Fetch repository file tree
 */
export async function fetchRepoTree(owner: string, repo: string, token?: string): Promise<any> {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        { headers }
    );

    if (!response.ok) {
        // Try 'master' branch if 'main' fails
        const masterResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
            { headers }
        );
        if (!masterResponse.ok) {
            throw new Error('Failed to fetch repository tree');
        }
        return masterResponse.json();
    }

    return response.json();
}

/**
 * Fetch file contents
 */
export async function fetchFileContents(owner: string, repo: string, path: string, token?: string): Promise<string> {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${path}`);
    }

    return response.text();
}

/**
 * Analyze README quality
 */
function analyzeREADMEQuality(readme: string): number {
    let score = 0;

    // Length check (20 points)
    if (readme.length > 500) score += 10;
    if (readme.length > 1500) score += 10;

    // Structure checks (40 points)
    if (readme.includes('# ') || readme.includes('## ')) score += 10; // Has headers
    if (readme.includes('```')) score += 10; // Has code blocks
    if (readme.includes('![') || readme.includes('<img')) score += 5; // Has images
    if (readme.toLowerCase().includes('installation')) score += 5; // Installation section
    if (readme.toLowerCase().includes('usage')) score += 5; // Usage section
    if (readme.toLowerCase().includes('license')) score += 5; // License section

    // Links and badges (20 points)
    const linkCount = (readme.match(/\[.*?\]\(.*?\)/g) || []).length;
    if (linkCount > 3) score += 10;
    if (readme.includes('badge') || readme.includes('shields.io')) score += 10;

    // Documentation depth (20 points)
    if (readme.toLowerCase().includes('api') || readme.toLowerCase().includes('documentation')) score += 10;
    if (readme.toLowerCase().includes('example') || readme.toLowerCase().includes('demo')) score += 10;

    return Math.min(score, 100);
}

/**
 * Analyze code organization from file tree
 */
function analyzeCodeOrganization(tree: any): number {
    const files = tree.tree || [];
    let score = 0;

    const paths = files.map((f: any) => f.path);

    // Directory structure (40 points)
    const hasSrc = paths.some((p: string) => p.startsWith('src/'));
    const hasLib = paths.some((p: string) => p.startsWith('lib/'));
    const hasComponents = paths.some((p: string) => p.includes('component'));
    const hasUtils = paths.some((p: string) => p.includes('util'));

    if (hasSrc || hasLib) score += 15;
    if (hasComponents) score += 10;
    if (hasUtils) score += 10;
    if (paths.some((p: string) => p.includes('config'))) score += 5;

    // Configuration files (30 points)
    if (paths.includes('package.json')) score += 10;
    if (paths.includes('tsconfig.json') || paths.includes('jsconfig.json')) score += 10;
    if (paths.includes('.gitignore')) score += 5;
    if (paths.includes('.env.example') || paths.includes('.env.template')) score += 5;

    // File count and depth (30 points)
    const fileCount = files.filter((f: any) => f.type === 'blob').length;
    if (fileCount > 10) score += 10;
    if (fileCount > 50) score += 10;

    const maxDepth = Math.max(...paths.map((p: string) => p.split('/').length));
    if (maxDepth >= 3) score += 10;

    return Math.min(score, 100);
}

/**
 * Analyze test coverage
 */
function analyzeTestCoverage(tree: any): number {
    const files = tree.tree || [];
    const paths = files.map((f: any) => f.path.toLowerCase());

    let score = 0;

    // Test directory (40 points)
    const hasTestDir = paths.some((p: string) =>
        p.includes('test/') || p.includes('tests/') || p.includes('__tests__/')
    );
    if (hasTestDir) score += 40;

    // Test files (40 points)
    const testFiles = paths.filter((p: string) =>
        p.includes('.test.') || p.includes('.spec.') || p.includes('_test.')
    );
    if (testFiles.length > 0) score += 20;
    if (testFiles.length > 5) score += 20;

    // Test configuration (20 points)
    if (paths.includes('jest.config.js') || paths.includes('jest.config.ts')) score += 10;
    if (paths.includes('vitest.config.ts') || paths.includes('vitest.config.js')) score += 10;
    if (paths.includes('.coveragerc') || paths.includes('coverage/')) score += 10;

    return Math.min(score, 100);
}

/**
 * Analyze documentation
 */
function analyzeDocumentation(tree: any): number {
    const files = tree.tree || [];
    const paths = files.map((f: any) => f.path.toLowerCase());

    let score = 0;

    // Documentation directory (30 points)
    if (paths.some((p: string) => p.startsWith('docs/'))) score += 30;

    // Essential docs (40 points)
    if (paths.includes('readme.md')) score += 15;
    if (paths.includes('contributing.md')) score += 10;
    if (paths.includes('license') || paths.includes('license.md')) score += 10;
    if (paths.includes('changelog.md')) score += 5;

    // Additional docs (30 points)
    if (paths.includes('api.md') || paths.some((p: string) => p.includes('api-doc'))) score += 10;
    if (paths.some((p: string) => p.includes('.md') && p.includes('guide'))) score += 10;
    if (paths.includes('faq.md')) score += 5;
    if (paths.includes('architecture.md') || paths.includes('design.md')) score += 5;

    return Math.min(score, 100);
}

/**
 * Analyze commit activity
 */
function analyzeCommitActivity(commits: any[]): number {
    if (!commits || commits.length === 0) return 0;

    let score = 0;

    // Commit count (30 points)
    if (commits.length > 10) score += 15;
    if (commits.length > 50) score += 15;

    // Recent activity (40 points)
    const now = new Date();
    const recentCommits = commits.filter((c: any) => {
        const commitDate = new Date(c.commit.author.date);
        const daysDiff = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
    });

    if (recentCommits.length > 0) score += 20;
    if (recentCommits.length > 5) score += 20;

    // Commit consistency (30 points)
    if (commits.length >= 3) {
        const dates = commits.slice(0, 10).map((c: any) => new Date(c.commit.author.date).getTime());
        const intervals = [];
        for (let i = 1; i < dates.length; i++) {
            intervals.push(dates[i - 1] - dates[i]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // Lower standard deviation = more consistent commits
        if (stdDev < avgInterval * 0.5) score += 30;
        else if (stdDev < avgInterval) score += 15;
    }

    return Math.min(score, 100);
}

/**
 * Analyze community engagement
 */
function analyzeCommunityEngagement(metadata: any): number {
    let score = 0;

    // Stars (40 points)
    const stars = metadata.stargazers_count || 0;
    if (stars > 5) score += 10;
    if (stars > 20) score += 10;
    if (stars > 50) score += 10;
    if (stars > 100) score += 10;

    // Forks (30 points)
    const forks = metadata.forks_count || 0;
    if (forks > 2) score += 10;
    if (forks > 10) score += 10;
    if (forks > 25) score += 10;

    // Watchers (20 points)
    const watchers = metadata.watchers_count || 0;
    if (watchers > 3) score += 10;
    if (watchers > 10) score += 10;

    // Open issues (10 points - shows activity)
    const issues = metadata.open_issues_count || 0;
    if (issues > 0 && issues < 50) score += 10; // Some issues = active, too many = unmaintained

    return Math.min(score, 100);
}

/**
 * Analyze maintenance
 */
function analyzeMaintenance(metadata: any, tree: any): number {
    let score = 0;
    const files = tree.tree || [];
    const paths = files.map((f: any) => f.path.toLowerCase());

    // Recent updates (50 points)
    const lastUpdate = new Date(metadata.updated_at);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 7) score += 50;
    else if (daysSinceUpdate < 30) score += 40;
    else if (daysSinceUpdate < 90) score += 25;
    else if (daysSinceUpdate < 180) score += 10;

    // CI/CD (30 points)
    const hasCI = paths.some((p: string) =>
        p.includes('.github/workflows/') ||
        p.includes('.gitlab-ci.yml') ||
        p.includes('.travis.yml') ||
        p.includes('circle.yml')
    );
    if (hasCI) score += 30;

    // Linting/Quality tools (20 points)
    if (paths.includes('.eslintrc') || paths.includes('.eslintrc.json') || paths.includes('.eslintrc.js')) score += 10;
    if (paths.includes('.prettierrc') || paths.includes('prettier.config.js')) score += 5;
    if (paths.includes('.editorconfig')) score += 5;

    return Math.min(score, 100);
}

/**
 * Main analysis function
 */
export async function analyzeRepositoryQuality(
    owner: string,
    repo: string,
    readme: string,
    metadata: any,
    commits: any[],
    token?: string
): Promise<RepoAnalysisResult> {
    try {
        // Fetch repository tree
        const tree = await fetchRepoTree(owner, repo, token);

        // Calculate individual scores
        const readmeQuality = analyzeREADMEQuality(readme);
        const codeOrganization = analyzeCodeOrganization(tree);
        const testCoverage = analyzeTestCoverage(tree);
        const documentation = analyzeDocumentation(tree);
        const commitActivity = analyzeCommitActivity(commits);
        const communityEngagement = analyzeCommunityEngagement(metadata);
        const maintenance = analyzeMaintenance(metadata, tree);

        // Weighted quality score
        const qualityScore = Math.round(
            readmeQuality * 0.20 +
            codeOrganization * 0.20 +
            testCoverage * 0.15 +
            documentation * 0.15 +
            commitActivity * 0.10 +
            communityEngagement * 0.10 +
            maintenance * 0.10
        );

        // Determine complexity
        const files = tree.tree || [];
        const fileCount = files.filter((f: any) => f.type === 'blob').length;
        let complexity = 'SIMPLE';
        if (fileCount > 100) complexity = 'COMPLEX';
        else if (fileCount > 50) complexity = 'MODERATE';
        else if (fileCount > 20) complexity = 'STANDARD';

        // Extract details
        const paths = files.map((f: any) => f.path.toLowerCase());
        const details = {
            hasTests: paths.some((p: string) => p.includes('test')),
            hasCI: paths.some((p: string) => p.includes('.github/workflows/') || p.includes('ci')),
            hasLinting: paths.some((p: string) => p.includes('eslint') || p.includes('prettier')),
            hasDocs: paths.some((p: string) => p.startsWith('docs/')),
            fileCount,
            directoryStructure: [...new Set(files.map((f: any) => f.path.split('/')[0]))].slice(0, 10) as string[],
            languages: metadata.languages || {}
        };

        return {
            qualityScore,
            complexity,
            readmeQuality,
            codeOrganization,
            testCoverage,
            documentation,
            commitActivity,
            communityEngagement,
            maintenance,
            details
        };
    } catch (error) {
        console.error('Quality analysis error:', error);
        // Return default scores on error
        return {
            qualityScore: 50,
            complexity: 'UNKNOWN',
            readmeQuality: 50,
            codeOrganization: 50,
            testCoverage: 0,
            documentation: 50,
            commitActivity: 50,
            communityEngagement: 50,
            maintenance: 50,
            details: {
                hasTests: false,
                hasCI: false,
                hasLinting: false,
                hasDocs: false,
                fileCount: 0,
                directoryStructure: [],
                languages: {}
            }
        };
    }
}
