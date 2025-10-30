-- Create user_stats table for XP and levels
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Create xp_logs table for XP history
CREATE TABLE public.xp_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source_action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on xp_logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for xp_logs
CREATE POLICY "Users can view own xp logs"
  ON public.xp_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp logs"
  ON public.xp_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create activity_streaks table
CREATE TABLE public.activity_streaks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type text NOT NULL,
  current_streak integer NOT NULL DEFAULT 1,
  last_checkin_date date NOT NULL,
  PRIMARY KEY (user_id, streak_type)
);

-- Enable RLS on activity_streaks
ALTER TABLE public.activity_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_streaks
CREATE POLICY "Users can view own activity streaks"
  ON public.activity_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity streaks"
  ON public.activity_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity streaks"
  ON public.activity_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to award XP
CREATE OR REPLACE FUNCTION public.award_xp(amount_to_add integer, action_source text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.xp_logs (user_id, amount, source_action)
  VALUES (auth.uid(), amount_to_add, action_source);

  INSERT INTO public.user_stats (user_id, total_xp)
  VALUES (auth.uid(), amount_to_add)
  ON CONFLICT (user_id)
  DO UPDATE SET total_xp = user_stats.total_xp + amount_to_add;
$$;

-- Create function to handle activity check-ins
CREATE OR REPLACE FUNCTION public.handle_activity_checkin(streak_type_to_check text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date date;
  today_date date := CURRENT_DATE;
  current_user_id uuid := auth.uid();
BEGIN
  SELECT last_checkin_date INTO last_date
  FROM public.activity_streaks
  WHERE user_id = current_user_id AND streak_type = streak_type_to_check;

  IF last_date IS NULL THEN
    -- First time for this streak type
    INSERT INTO public.activity_streaks (user_id, streak_type, current_streak, last_checkin_date)
    VALUES (current_user_id, streak_type_to_check, 1, today_date);
  ELSIF last_date = today_date THEN
    -- Already checked in today, do nothing
    RETURN;
  ELSIF last_date = today_date - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE public.activity_streaks
    SET current_streak = current_streak + 1,
        last_checkin_date = today_date
    WHERE user_id = current_user_id AND streak_type = streak_type_to_check;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.activity_streaks
    SET current_streak = 1,
        last_checkin_date = today_date
    WHERE user_id = current_user_id AND streak_type = streak_type_to_check;
  END IF;
END;
$$;