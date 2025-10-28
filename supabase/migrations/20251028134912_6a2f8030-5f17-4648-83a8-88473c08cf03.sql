-- Create table to store Google OAuth tokens
CREATE TABLE public.google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own Google tokens"
ON public.google_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google tokens"
ON public.google_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens"
ON public.google_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Add google_task_id column to mission_tasks for linking
ALTER TABLE public.mission_tasks 
ADD COLUMN google_task_id TEXT;

-- Create index for faster lookups
CREATE INDEX idx_mission_tasks_google_task_id ON public.mission_tasks(google_task_id);