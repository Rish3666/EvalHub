-- Migration: Definitive Guest Analysis Fix
-- This script completely resets RLS policies for the projects table to ensure analysis works for everyone.

-- 1. Ensure user_id is nullable (allow guest ownership)
ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;

-- 2. Explicitly grant permissions to both authenticated and anonymous roles
GRANT ALL ON TABLE public.projects TO anon, authenticated;
GRANT ALL ON TABLE public.project_analyses TO anon, authenticated;
GRANT ALL ON TABLE public.project_answers TO anon, authenticated;
GRANT ALL ON TABLE public.scorecards TO anon, authenticated;

-- 3. Reset and recreate Projects policies
-- We drop EVERY previous policy name we've used to be sure
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Public projects viewable by all" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable view for all users" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for all" ON public.projects;
DROP POLICY IF EXISTS "allow_all_insert" ON public.projects;
DROP POLICY IF EXISTS "allow_all_select" ON public.projects;
DROP POLICY IF EXISTS "allow_all_update" ON public.projects;
DROP POLICY IF EXISTS "allow_all_delete" ON public.projects;

-- Create absolute permissive policies for projects
CREATE POLICY "allow_all_insert" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "allow_all_update" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "allow_all_delete" ON public.projects FOR DELETE USING (true);

-- 4. Reset and recreate Project Analyses policies
DROP POLICY IF EXISTS "Users can view own analyses" ON public.project_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.project_analyses;
DROP POLICY IF EXISTS "Enable insert for all analyses" ON public.project_analyses;
DROP POLICY IF EXISTS "Enable view for all analyses" ON public.project_analyses;

CREATE POLICY "analyses_allow_all" ON public.project_analyses FOR ALL USING (true) WITH CHECK (true);

-- 5. Reset and recreate Project Answers policies
DROP POLICY IF EXISTS "Users can view own answers" ON public.project_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.project_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.project_answers;
DROP POLICY IF EXISTS "Enable insert for all answers" ON public.project_answers;
DROP POLICY IF EXISTS "Enable view for all answers" ON public.project_answers;

CREATE POLICY "answers_allow_all" ON public.project_answers FOR ALL USING (true) WITH CHECK (true);

-- 6. Reset and recreate Scorecards policies
DROP POLICY IF EXISTS "Public scorecards viewable by all" ON public.scorecards;
DROP POLICY IF EXISTS "Users can view own scorecards" ON public.scorecards;
DROP POLICY IF EXISTS "Users can insert own scorecards" ON public.scorecards;
DROP POLICY IF EXISTS "Users can update own scorecards" ON public.scorecards;
DROP POLICY IF EXISTS "Enable insert for all scorecards" ON public.scorecards;

CREATE POLICY "scorecards_allow_all" ON public.scorecards FOR ALL USING (true) WITH CHECK (true);

-- 7. Ensure RLS is enabled for data security (even with permissive policies, RLS must be ON for policies to apply)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;
