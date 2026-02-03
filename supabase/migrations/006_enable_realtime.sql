-- Migration 006: Enable Realtime for Messages
-- Enable Supabase Realtime for instant message delivery

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
