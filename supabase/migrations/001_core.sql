-- Migration 001: Core Foundation
-- Standardizes Users, Projects, and Analysis tables with IDEMPOTENT guards.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  github_username TEXT UNIQUE,
  bio TEXT,
  location TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table (Guest-Compatible)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Nullable for guests
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  challenge TEXT,
  solution TEXT,
  demo_url TEXT,
  video_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project Analyses Table
CREATE TABLE IF NOT EXISTS public.project_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  readme_content TEXT,
  ai_analysis JSONB NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Answers Table
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

-- 5. Scorecards Table
CREATE TABLE IF NOT EXISTS public.scorecards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100) NOT NULL,
  skill_breakdown JSONB NOT NULL DEFAULT '{}',
  technologies_known JSONB NOT NULL DEFAULT '{}',
  skill_gaps JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '{}',
  strengths TEXT[] NOT NULL DEFAULT '{}',
  areas_for_improvement TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  share_token VARCHAR(32) UNIQUE NOT NULL,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;

-- Consolidated Policies (DROP before CREATE for idempotency)
DROP POLICY IF EXISTS "Public access" ON public.users;
CREATE POLICY "Public access" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_all_projects" ON public.projects;
CREATE POLICY "allow_all_projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_analyses" ON public.project_analyses;
CREATE POLICY "allow_all_analyses" ON public.project_analyses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_answers" ON public.project_answers;
CREATE POLICY "allow_all_answers" ON public.project_answers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_scorecards" ON public.scorecards;
CREATE POLICY "allow_all_scorecards" ON public.scorecards FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.projects TO anon, authenticated;
GRANT ALL ON public.project_analyses TO anon, authenticated;
GRANT ALL ON public.project_answers TO anon, authenticated;
GRANT ALL ON public.scorecards TO anon, authenticated;

-- Shared Helpers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
