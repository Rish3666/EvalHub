-- DevShowcase Database Schema
-- This migration creates all necessary tables for the AI-powered developer skill analysis platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL,
  challenge TEXT,
  solution TEXT,
  demo_url TEXT,
  video_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project analyses table (stores AI README analysis)
CREATE TABLE IF NOT EXISTS public.project_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  readme_content TEXT,
  ai_analysis JSONB NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project answers table (stores user answers to questions)
CREATE TABLE IF NOT EXISTS public.project_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  question_id INTEGER NOT NULL,
  answer TEXT,
  is_skipped BOOLEAN DEFAULT false,
  used_hint BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, question_id)
);

-- Scorecards table (stores AI-generated skill evaluations)
CREATE TABLE IF NOT EXISTS public.scorecards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100) NOT NULL,
  skill_breakdown JSONB NOT NULL,
  technologies_known JSONB NOT NULL,
  skill_gaps JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  strengths TEXT[] NOT NULL,
  areas_for_improvement TEXT[] NOT NULL,
  is_public BOOLEAN DEFAULT true,
  share_token VARCHAR(32) UNIQUE NOT NULL,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON public.projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_project_analyses_project_id ON public.project_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_answers_project_id ON public.project_answers(project_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_project_id ON public.scorecards(project_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_share_token ON public.scorecards(share_token);
CREATE INDEX IF NOT EXISTS idx_scorecards_public ON public.scorecards(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public projects viewable by all" ON public.projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for project_analyses table
CREATE POLICY "Users can view own analyses" ON public.project_analyses
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own analyses" ON public.project_analyses
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- RLS Policies for project_answers table
CREATE POLICY "Users can view own answers" ON public.project_answers
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own answers" ON public.project_answers
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own answers" ON public.project_answers
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- RLS Policies for scorecards table
CREATE POLICY "Public scorecards viewable by all" ON public.scorecards
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own scorecards" ON public.scorecards
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own scorecards" ON public.scorecards
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own scorecards" ON public.scorecards
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- Function to increment scorecard views
CREATE OR REPLACE FUNCTION increment_scorecard_views(token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.scorecards
  SET views_count = views_count + 1
  WHERE share_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scorecards_updated_at BEFORE UPDATE ON public.scorecards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
