
-- Create Communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for communities table
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities table
CREATE POLICY "Public communities are viewable by all." ON public.communities
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can create communities." ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own communities." ON public.communities
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own communities." ON public.communities
  FOR DELETE USING (auth.uid() = creator_id);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
