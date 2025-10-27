-- Add running_km to health_logs log_type values
-- No schema change needed as log_type is already text without constraints

-- Create daily_ratings table for day rating feature
CREATE TABLE IF NOT EXISTS public.daily_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, rating_date)
);

-- Enable RLS on daily_ratings
ALTER TABLE public.daily_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_ratings
CREATE POLICY "Users can view own daily ratings"
  ON public.daily_ratings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily ratings"
  ON public.daily_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily ratings"
  ON public.daily_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily ratings"
  ON public.daily_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create glow_up_logs table
CREATE TABLE IF NOT EXISTS public.glow_up_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overthinking_level INTEGER CHECK (overthinking_level >= 1 AND overthinking_level <= 5),
  wasted_tasks INTEGER CHECK (wasted_tasks >= 0),
  did_skincare BOOLEAN,
  did_haircare BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS on glow_up_logs
ALTER TABLE public.glow_up_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for glow_up_logs
CREATE POLICY "Users can view own glow up logs"
  ON public.glow_up_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own glow up logs"
  ON public.glow_up_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own glow up logs"
  ON public.glow_up_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own glow up logs"
  ON public.glow_up_logs
  FOR DELETE
  USING (auth.uid() = user_id);