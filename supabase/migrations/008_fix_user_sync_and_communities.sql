-- Migration 008: Fix User Sync and Communities Schema
-- This migration ensures every Supabase Auth user has a corresponding row in public.users
-- and fixes the community creation schema dependencies.

-- 1. Create Handle New User Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, github_username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name' -- GitHub OAuth returns 'user_name' for the login
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    github_username = EXCLUDED.github_username;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create User Sync Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing users (Optional but helpful for development)
INSERT INTO public.users (id, email, full_name, avatar_url, github_username)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url', 
    raw_user_meta_data->>'user_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Fix Community RLS and Creator ID
-- Ensure creator_id is not null for future inserts while allowing existing entries
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Update RLS for community creation
DROP POLICY IF EXISTS "Allow authenticated users to create communities" ON public.communities;
CREATE POLICY "Allow authenticated users to create communities" ON public.communities
    FOR INSERT WITH CHECK (auth.uid() = creator_id OR (creator_id IS NULL AND auth.role() = 'authenticated'));

-- 5. Community Members Join Policy
DROP POLICY IF EXISTS "Allow authenticated users to join" ON public.community_members;
CREATE POLICY "Allow authenticated users to join" ON public.community_members 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
