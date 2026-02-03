-- Add profile fields to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON public.users (username);

-- Public profiles view (Security Invoker handles permissions correctly)
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT
  id,
  username,
  full_name,
  avatar_url,
  bio,
  location,
  github_username,
  created_at
FROM public.users
WHERE is_public = TRUE AND username IS NOT NULL;

-- Permissions for profile lookup
REVOKE SELECT ON public.users FROM public, anon, authenticated;
GRANT SELECT (id, username, full_name, avatar_url, bio, location, github_username, is_public, created_at) ON public.users TO authenticated, anon;

-- Explicit RLS policy for profile selection
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (is_public = true);

-- Friend requests
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee_id ON public.friend_requests (addressee_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester_id ON public.friend_requests (requester_id);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their friend requests" ON public.friend_requests;
CREATE POLICY "Users can view their friend requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Recipients can respond to friend requests" ON public.friend_requests;
CREATE POLICY "Recipients can respond to friend requests" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = addressee_id);

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
