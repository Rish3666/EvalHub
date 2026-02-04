-- MASTER SCHEMA PART 3: Social & Interactions
-- OPTIMIZED: Indexes for Repo lookups, consolidated policies, and Realtime setup.

-- 1. Friend Requests Table
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

-- Indexes for Friend Lookups
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee ON public.friend_requests(addressee_id);

-- 2. Feed Likes (linked to GitHub repo IDs)
CREATE TABLE IF NOT EXISTS public.feed_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_id BIGINT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repo_id, user_id)
);

-- Index for Feed Queries
CREATE INDEX IF NOT EXISTS idx_feed_likes_repo_id ON public.feed_likes(repo_id);

-- 3. Feed Comments
CREATE TABLE IF NOT EXISTS public.feed_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_id BIGINT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_repo_id ON public.feed_comments(repo_id);

-- 4. RLS Configuration
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users view own requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can send requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Recipients can respond" ON public.friend_requests;
    DROP POLICY IF EXISTS "Anyone can view interactions" ON public.feed_likes;
    DROP POLICY IF EXISTS "Anyone can view comments" ON public.feed_comments;
    DROP POLICY IF EXISTS "Auth users can like" ON public.feed_likes;
    DROP POLICY IF EXISTS "Users can remove likes" ON public.feed_likes;
    DROP POLICY IF EXISTS "Auth users can comment" ON public.feed_comments;
    DROP POLICY IF EXISTS "Users can delete own comments" ON public.feed_comments;
END $$;

-- Friend Request Policies
CREATE POLICY "Users view own requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can respond" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = addressee_id);

-- Interaction Policies (Public Read, Auth Write)
CREATE POLICY "Anyone can view interactions" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove likes" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.feed_comments FOR DELETE USING (auth.uid() = user_id);

-- 5. Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'feed_likes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_likes;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'feed_comments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;
    END IF;
END $$;

-- 6. Trigger for updates
DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feed_comments_updated_at ON public.feed_comments;
CREATE TRIGGER update_feed_comments_updated_at BEFORE UPDATE ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
