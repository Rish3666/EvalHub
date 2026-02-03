-- MASTER SCHEMA PART 2: Projects & AI Analysis
-- Setup for tracking repos, AI evaluations, and performance caching.

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Project AI Analysis Results (Detailed)
CREATE TABLE IF NOT EXISTS public.project_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  readme_content TEXT,
  ai_analysis JSONB NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Interview Answers
CREATE TABLE IF NOT EXISTS public.project_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  question_id INTEGER NOT NULL,
  answer TEXT,
  is_skipped BOOLEAN DEFAULT FALSE,
  used_hint BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, question_id)
);

-- 4. Scorecards Table
CREATE TABLE IF NOT EXISTS public.scorecards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100) NOT NULL,
  skill_breakdown JSONB NOT NULL DEFAULT '{}',
  share_token VARCHAR(32) UNIQUE NOT NULL,
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Analysis Cache (Global Cache for all users)
CREATE TABLE IF NOT EXISTS public.project_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_full_name TEXT UNIQUE NOT NULL, -- e.g., "facebook/react"
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS & Permissions
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analysis ENABLE ROW LEVEL SECURITY;

-- Shared public view policies
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Anyone can view analyses" ON public.project_analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can view scorecards" ON public.scorecards FOR SELECT USING (true);
CREATE POLICY "Authenticated users read cache" ON public.project_analysis FOR SELECT USING (auth.role() = 'authenticated');

-- Operational policies
CREATE POLICY "Users can manage their projects" ON public.projects 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users write cache" ON public.project_analysis 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Grants
GRANT ALL ON public.projects TO anon, authenticated;
GRANT ALL ON public.project_analyses TO anon, authenticated;
GRANT ALL ON public.project_answers TO anon, authenticated;
GRANT ALL ON public.scorecards TO anon, authenticated;
GRANT ALL ON public.project_analysis TO authenticated;

-- Create Trigger for projects update
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
