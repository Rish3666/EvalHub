import { createClient } from '@/lib/supabase/server';
import { fetchREADME, fetchRepoMetadata, fetchRepoLanguages, fetchRepoCommits } from '@/lib/utils/github';
import { analyzeREADMEWithFallback } from '@/lib/ai/gemini';
import { analyzeRepositoryQuality } from '@/lib/utils/codeAnalysis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { repoFullName } = await request.json();

        if (!repoFullName) {
            return NextResponse.json({ error: 'Repository full name required' }, { status: 400 });
        }

        const repoUrl = `https://github.com/${repoFullName}`;
        const [owner, repo] = repoFullName.split('/');
        const supabase = await createClient();
        const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

        // 1. Check Cache
        const { data: cached } = await supabase
            .from('project_analysis')
            .select('*')
            .eq('repo_full_name', repoFullName)
            .single();

        let analysisData;
        let commits;

        if (cached) {
            analysisData = cached.analysis_data;
        } else {
            // 2. Fetch Data from GitHub
            const [readme, metadata, languages] = await Promise.all([
                fetchREADME(repoUrl),
                fetchRepoMetadata(repoUrl),
                fetchRepoLanguages(repoUrl)
            ]);

            if (!readme) {
                return NextResponse.json({ error: 'README not found' }, { status: 404 });
            }

            // 3. Fetch commits for quality analysis
            commits = await fetchRepoCommits(repoUrl);

            // 4. Run Enhanced Quality Analysis (First, to get scores for hard indexing)
            const qualityAnalysis = await analyzeRepositoryQuality(
                owner,
                repo,
                readme,
                metadata, // Pass metadata
                commits || [], // Pass commits
                githubToken // Pass token
            );

            // 5. Run AI Analysis (Pass quality scores for hard indexing)
            const analysis = await analyzeREADMEWithFallback(readme, {
                title: metadata?.name || repoFullName.split('/')[1],
                description: metadata?.description || '',
                techStack: Object.keys(languages || {}),
                challenge: '',
                solution: ''
            }, qualityAnalysis);

            // Merge the hard indexed analysis with the quality metrics
            analysis.analysis = {
                ...analysis.analysis,
                qualityScore: qualityAnalysis.qualityScore,
            };

            analysisData = {
                ...analysis.analysis,
                repoMetadata: metadata,
                languages: languages,
                qualityScore: qualityAnalysis.qualityScore,
                complexity: qualityAnalysis.complexity,
                adaptationScore: qualityAnalysis.maintenance, // For UI compatibility
                implementationEstimate: estimateImplementationTime(qualityAnalysis),
                qualityBreakdown: {
                    readmeQuality: qualityAnalysis.readmeQuality,
                    codeOrganization: qualityAnalysis.codeOrganization,
                    testCoverage: qualityAnalysis.testCoverage,
                    documentation: qualityAnalysis.documentation,
                    commitActivity: qualityAnalysis.commitActivity,
                    communityEngagement: qualityAnalysis.communityEngagement,
                    maintenance: qualityAnalysis.maintenance
                },
                details: qualityAnalysis.details
            };

            // 6. Cache Result
            await supabase
                .from('project_analysis')
                .insert({
                    repo_full_name: repoFullName,
                    analysis_data: analysisData
                });
        }

        // 7. Always fetch fresh commits if not already fetched
        if (!commits) {
            commits = await fetchRepoCommits(repoUrl);
        }

        return NextResponse.json({
            success: true,
            analysis: analysisData,
            commits: commits
        });

    } catch (error) {
        console.error('Remote analysis error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Analysis failed' },
            { status: 500 }
        );
    }
}

/**
 * Estimate implementation time based on quality metrics
 */
function estimateImplementationTime(quality: any): string {
    const fileCount = quality.details.fileCount || 0;
    const complexity = quality.complexity;

    if (complexity === 'COMPLEX' || fileCount > 100) return '2-4 WEEKS';
    if (complexity === 'MODERATE' || fileCount > 50) return '1-2 WEEKS';
    if (fileCount > 20) return '3-7 DAYS';
    return '1-3 DAYS';
}
