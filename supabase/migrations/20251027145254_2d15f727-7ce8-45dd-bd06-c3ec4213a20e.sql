-- Change did_skincare and did_haircare from boolean to integer in glow_up_logs
ALTER TABLE public.glow_up_logs 
  ALTER COLUMN did_skincare TYPE integer USING (CASE WHEN did_skincare THEN 1 ELSE 0 END),
  ALTER COLUMN did_skincare SET DEFAULT 0,
  ALTER COLUMN did_haircare TYPE integer USING (CASE WHEN did_haircare THEN 1 ELSE 0 END),
  ALTER COLUMN did_haircare SET DEFAULT 0;