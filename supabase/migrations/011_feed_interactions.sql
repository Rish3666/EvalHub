-- Migration 011: Feed Interactions
-- Add support for Likes and Comments on GitHub Repositories (Feed Items)

-- 1. Feed Likes Table
CREATE TABLE IF NOT EXISTS public.feed_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_id BIGINT NOT NULL, -- Matched to GitHub Repository ID
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repo_id, user_id) -- One like per user per repo
);

-- 2. Feed Comments Table
CREATE TABLE IF NOT EXISTS public.feed_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_id BIGINT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Policies for Likes
CREATE POLICY "Anyone can view likes" ON public.feed_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.feed_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.feed_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for Comments
CREATE POLICY "Anyone can view comments" ON public.feed_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.feed_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.feed_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;
