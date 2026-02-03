-- Migration 008: Add User Presence and Online Status
-- Tracks user online status and last seen timestamp

-- Add last_seen and online_status to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away'));

-- Enable Realtime for users table (specifically for online_status)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Create a function to update last_seen
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Not strictly necessary as we'll update via client, but good for data integrity
