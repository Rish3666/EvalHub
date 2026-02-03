-- Migration 010: Project Analysis Cache
-- Create a table to store AI-generated analysis results to improve performance.

CREATE TABLE IF NOT EXISTS public.project_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_full_name TEXT NOT NULL, -- e.g., "owner/repo"
    analysis_data JSONB NOT NULL, -- The full JSON result from Gemini
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure we don't duplicate analysis for the same repo (basic caching)
    -- We can add a 'version' column later if we want to force re-analysis
    UNIQUE(repo_full_name)
);

-- Enable RLS
ALTER TABLE public.project_analysis ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read analysis (it's general code stats, not private user data usually, but we can restrict if needed)
-- For now, let's allow authenticated users to read.
CREATE POLICY "Authenticated users can read analysis" ON public.project_analysis
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only the server (service role) or the user viewing it can insert?
-- Actually, we'll likely insert this server-side via service role or the user performing the analysis.
-- Let's allow authenticated users to insert for now, as the API routes run as the user.
CREATE POLICY "Authenticated users can insert analysis" ON public.project_analysis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow updates (e.g. re-analysis)
CREATE POLICY "Authenticated users can update analysis" ON public.project_analysis
    FOR UPDATE USING (auth.role() = 'authenticated');
