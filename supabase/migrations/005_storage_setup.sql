-- Migration 005: Storage Setup
-- Create a bucket for community attachments.

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('communities', 'communities', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'communities');

-- 3. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'communities' AND 
    auth.role() = 'authenticated'
  );

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'communities' AND 
    auth.uid() = owner
  );
