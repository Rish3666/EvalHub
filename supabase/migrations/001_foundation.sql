-- MASTER SCHEMA PART 1: Foundation & Identity
-- OPTIMIZED: Added indexes, robust RLS policies, and conflict handling.

-- 1. Setup Base Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Performance Helpers & Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Users Table (Optimized)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  github_username TEXT UNIQUE,
  bio TEXT,
  location TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster profile lookups by username
CREATE INDEX IF NOT EXISTS idx_users_github_username ON public.users(github_username);

-- 4. Auth Sync Trigger (GitHub OAuth) - Robust Handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, github_username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name' -- GitHub username mapping
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    github_username = COALESCE(EXCLUDED.github_username, public.users.github_username),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill logic (Idempotent)
INSERT INTO public.users (id, email, full_name, avatar_url, github_username)
SELECT 
    id, email, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url', 
    raw_user_meta_data->>'user_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. RLS Policies (STRICT & OPTIMIZED)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper to safely drop policies for idempotency
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
END $$;

-- Policy 1: Public Read Access
CREATE POLICY "Public access" ON public.users FOR SELECT USING (true);

-- Policy 2: Update Own Profile
CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Insert Own Profile (CRITICAL FIX)
CREATE POLICY "Users can insert their own profile" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Permissions
GRANT ALL ON public.users TO anon, authenticated;
