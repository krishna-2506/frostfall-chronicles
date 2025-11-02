-- Add status field to missions table
ALTER TABLE public.missions 
ADD COLUMN status text NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'completed', 'failed'));

-- Create gym_logs table for workout tracking
CREATE TABLE public.gym_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  muscle_group text NOT NULL,
  exercise_name text NOT NULL,
  sets integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on gym_logs
ALTER TABLE public.gym_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for gym_logs
CREATE POLICY "Users can view own gym logs" 
ON public.gym_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gym logs" 
ON public.gym_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gym logs" 
ON public.gym_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gym logs" 
ON public.gym_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_gym_logs_user_date ON public.gym_logs(user_id, log_date);
CREATE INDEX idx_missions_user_status ON public.missions(user_id, status);