-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tech_stack JSONB DEFAULT '[]',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create company_matches table
CREATE TABLE IF NOT EXISTS public.company_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    compatibility_score INTEGER NOT NULL,
    match_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, company_id)
);

-- RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allows public read access to companies" ON public.companies
    FOR SELECT USING (true);

-- RLS for company_matches
ALTER TABLE public.company_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches" ON public.company_matches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches" ON public.company_matches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add some seed data for companies
INSERT INTO public.companies (name, description, tech_stack, logo_url)
VALUES 
('Stitch Inc.', 'Platform for building production-ready apps.', '["React", "TypeScript", "Next.js", "Supabase", "TailwindCSS"]', 'https://github.com/shadcn.png'),
('Echo Labs', 'AI-driven networking and communication.', '["Python", "Node.js", "TypeScript", "OpenAI", "PostgreSQL"]', 'https://github.com/shadcn.png'),
('Vecto Systems', 'High-performance graphics and physics engines.', '["C++", "Rust", "WebAssembly", "Spline"]', 'https://github.com/shadcn.png')
ON CONFLICT DO NOTHING;
