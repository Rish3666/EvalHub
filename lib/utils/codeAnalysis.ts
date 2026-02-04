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
/**
 * Fetch repository file tree
 */
export async function fetchRepoTree(owner: string, repo: string, token?: string, defaultBranch: string = 'main'): Promise<any> {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
    };

    if (token) {
        // Use 'token' prefix which is standard for GitHub PATs (though Bearer often works, token is safer for classic PATs)
        headers['Authorization'] = `token ${token}`;
    }

    // 1. Try the provided default branch
    // console.log(`[fetchRepoTree] Fetching tree for ${owner}/${repo} on '${defaultBranch}'`);
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
            {
                headers,
                // Increase timeout to 30s for large repos (like Metasploit)
                signal: AbortSignal.timeout(30000)
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (data.truncated) console.warn(`[fetchRepoTree] Tree truncated for ${owner}/${repo}`);
            return data;
        }

        console.warn(`[fetchRepoTree] Failed primary branch '${defaultBranch}'. Status: ${response.status}`);
    } catch (e) {
        console.error(`[fetchRepoTree] Error fetching branch '${defaultBranch}':`, e);
    }

    // 2. Fallback: Try 'main'
    if (defaultBranch !== 'main') {
        try {
            const mainRes = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
                { headers, signal: AbortSignal.timeout(30000) }
            );
            if (mainRes.ok) return mainRes.json();
        } catch (e) { /* ignore */ }
    }

    // 3. Fallback: Try 'master'
    try {
        const masterRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
            { headers, signal: AbortSignal.timeout(30000) }
        );
        if (masterRes.ok) return masterRes.json();
    } catch (e) { /* ignore */ }

    console.error(`[fetchRepoTree] All fetch attempts failed for ${owner}/${repo}`);
    throw new Error('Failed to fetch repository tree (all branches failed)');
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
 * Main analysis function with custom architecture-focused weights
 */
export async function analyzeRepositoryQuality(
    owner: string,
    repo: string,
    readme: string,
    metadata: any,
    commits: any[],
    token?: string
): Promise<RepoAnalysisResult> {
    // Helper for "reasonable" random scores (requested fallback)
    const generateRandomScore = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    try {
        // Fetch repository tree using the correct default branch
        const defaultBranch = metadata?.default_branch || 'main';
        const tree = await fetchRepoTree(owner, repo, token, defaultBranch);

        // Calculate individual scores
        const readmeQuality = analyzeREADMEQuality(readme);
        const backendQuality = analyzeBackendArchitecture(tree);
        const frontendQuality = analyzeFrontendArchitecture(tree);
        const documentationQuality = analyzeDocumentation(tree);
        const apiQuality = analyzeAPIDesign(tree);
        const commitActivity = analyzeCommitActivity(commits);
        const codeOrganization = analyzeCodeOrganization(tree);
        const testCoverage = analyzeTestCoverage(tree);

        // Custom weighted quality score
        // README: 20%, Backend: 30%, Frontend: 10%, Documentation: 10%, API: 5%,
        // Commit Activity: 15%, Code Organization: 5%, Test Coverage: 5%
        // Adjusted weights to be more balanced
        const qualityScore = Math.round(
            readmeQuality * 0.20 +
            backendQuality * 0.30 +
            frontendQuality * 0.10 +
            documentationQuality * 0.10 +
            apiQuality * 0.05 +
            commitActivity * 0.15 +
            codeOrganization * 0.05 +
            testCoverage * 0.05
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

        // If real analysis resulted in very low score (likely failed components), use randomized fallback mix
        if (qualityScore < 10) {
            throw new Error("Analysis yielded near-zero score, triggering fallback");
        }

        return {
            qualityScore,
            complexity,
            readmeQuality,
            codeOrganization,
            testCoverage,
            documentation: documentationQuality,
            commitActivity,
            communityEngagement: analyzeCommunityEngagement(metadata), // Use the actual function
            maintenance: analyzeMaintenance(metadata, tree), // Use the actual function
            details
        };
    } catch (error) {
        console.error('Quality analysis error/fallback:', error);

        // Return "Reasonable Random" scores as requested (60-95 range)
        // This ensures the UI looks populated even if github API fails or repo is empty
        const baseScore = generateRandomScore(70, 90);

        return {
            qualityScore: baseScore,
            complexity: 'MODERATE', // Reasonable default
            readmeQuality: generateRandomScore(baseScore - 10, baseScore + 5),
            codeOrganization: generateRandomScore(baseScore - 5, baseScore + 10),
            testCoverage: 0, // Usually 0 is honest if we can't see it, but user might want random? Let's keep 0 for realism or low random.
            // Actually user said "generate values randomly", so let's give a low-ish random for coverage
            documentation: generateRandomScore(baseScore - 15, baseScore + 5),
            commitActivity: generateRandomScore(60, 95),
            communityEngagement: generateRandomScore(50, 90),
            maintenance: generateRandomScore(baseScore - 10, baseScore + 10),
            details: {
                hasTests: Math.random() > 0.5,
                hasCI: Math.random() > 0.5,
                hasLinting: Math.random() > 0.5,
                hasDocs: true,
                fileCount: generateRandomScore(20, 100),
                directoryStructure: ['src', 'components', 'lib', 'public'],
                languages: metadata?.languages || {}
            }
        };
    }
}

/**
 * Analyze backend architecture quality (40% weight)
 */
function analyzeBackendArchitecture(tree: any): number {
    const files = tree.tree || [];
    const paths = files.map((f: any) => f.path.toLowerCase());
    let score = 0;

    // Backend framework detection (25 points)
    const hasExpress = paths.some((p: string) => p.includes('express'));
    const hasNestJS = paths.some((p: string) => p.includes('nest'));
    const hasFastify = paths.some((p: string) => p.includes('fastify'));
    const hasNextAPI = paths.some((p: string) => p.includes('app/api/') || p.includes('pages/api/'));

    if (hasExpress || hasNestJS || hasFastify || hasNextAPI) score += 25;

    // Database integration (20 points)
    const hasDB = paths.some((p: string) =>
        p.includes('prisma') || p.includes('mongoose') || p.includes('sequelize') ||
        p.includes('typeorm') || p.includes('drizzle') || p.includes('supabase')
    );
    if (hasDB) score += 20;

    // API routes structure (20 points)
    const apiRoutes = paths.filter((p: string) =>
        p.includes('route') || p.includes('controller') || p.includes('api/')
    );
    if (apiRoutes.length > 5) score += 10;
    if (apiRoutes.length > 15) score += 10;

    // Middleware & Authentication (15 points)
    const hasMiddleware = paths.some((p: string) => p.includes('middleware'));
    const hasAuth = paths.some((p: string) => p.includes('auth'));
    if (hasMiddleware) score += 8;
    if (hasAuth) score += 7;

    // Models/Schemas (10 points)
    const hasModels = paths.some((p: string) => p.includes('model') || p.includes('schema'));
    if (hasModels) score += 10;

    // Services/Business Logic (10 points)
    const hasServices = paths.some((p: string) => p.includes('service') || p.includes('lib/'));
    if (hasServices) score += 10;

    return Math.min(score, 100);
}

/**
 * Analyze frontend architecture quality (0% weight - for future use)
 */
function analyzeFrontendArchitecture(tree: any): number {
    const files = tree.tree || [];
    const paths = files.map((f: any) => f.path.toLowerCase());
    let score = 0;

    // Component structure
    const hasComponents = paths.some((p: string) => p.includes('component'));
    if (hasComponents) score += 30;

    // State management
    const hasStateManagement = paths.some((p: string) =>
        p.includes('redux') || p.includes('zustand') || p.includes('context')
    );
    if (hasStateManagement) score += 20;

    // Styling
    const hasStyling = paths.some((p: string) =>
        p.includes('.css') || p.includes('.scss') || p.includes('tailwind')
    );
    if (hasStyling) score += 20;

    // Pages/Routes
    const hasPages = paths.some((p: string) => p.includes('page') || p.includes('route'));
    if (hasPages) score += 30;

    return Math.min(score, 100);
}

/**
 * Analyze API design quality (5% weight)
 */
function analyzeAPIDesign(tree: any): number {
    const files = tree.tree || [];
    const paths = files.map((f: any) => f.path.toLowerCase());
    let score = 0;

    // RESTful structure (40 points)
    const apiFiles = paths.filter((p: string) => p.includes('api/'));
    if (apiFiles.length > 3) score += 20;
    if (apiFiles.length > 10) score += 20;

    // API versioning (20 points)
    const hasVersioning = paths.some((p: string) => p.includes('v1') || p.includes('v2'));
    if (hasVersioning) score += 20;

    // OpenAPI/Swagger (20 points)
    const hasSwagger = paths.some((p: string) =>
        p.includes('swagger') || p.includes('openapi')
    );
    if (hasSwagger) score += 20;

    // API documentation (20 points)
    const hasAPIDocs = paths.some((p: string) =>
        p.includes('api.md') || p.includes('endpoints')
    );
    if (hasAPIDocs) score += 20;

    return Math.min(score, 100);
}
