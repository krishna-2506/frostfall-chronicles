-- Add pomodoro sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.mission_tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  session_type TEXT NOT NULL DEFAULT 'work', -- 'work', 'short_break', 'long_break'
  completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pomodoro sessions"
ON public.pomodoro_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro sessions"
ON public.pomodoro_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro sessions"
ON public.pomodoro_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Add enhanced fields to mission_tasks
ALTER TABLE public.mission_tasks
ADD COLUMN priority TEXT DEFAULT 'medium',
ADD COLUMN estimated_pomodoros INTEGER DEFAULT 1,
ADD COLUMN notes TEXT,
ADD COLUMN parent_task_id UUID REFERENCES public.mission_tasks(id) ON DELETE CASCADE,
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern TEXT,
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN reminder_time TIMESTAMP WITH TIME ZONE;

-- Add user pomodoro settings table
CREATE TABLE public.pomodoro_settings (
  user_id UUID NOT NULL PRIMARY KEY,
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
  auto_start_breaks BOOLEAN NOT NULL DEFAULT false,
  auto_start_pomodoros BOOLEAN NOT NULL DEFAULT false,
  notification_sound TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pomodoro settings"
ON public.pomodoro_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro settings"
ON public.pomodoro_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro settings"
ON public.pomodoro_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for pomodoro sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_sessions;