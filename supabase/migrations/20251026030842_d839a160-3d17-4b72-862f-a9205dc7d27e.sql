-- Add work_hours log type support to health_logs table
-- The value column is already integer type, so we'll store hours * 100 to represent decimals
-- Example: 7.5 hours = 750, 8.25 hours = 825

-- Add a comment to document the encoding for work_hours
COMMENT ON COLUMN public.health_logs.value IS 'For work_hours: value is hours * 100 (e.g., 7.5 hours = 750)';

-- Note: RLS policies already exist for health_logs table, so work_hours will automatically
-- be covered by the existing "Users can insert own health logs", "Users can view own health logs",
-- and "Users can update own health logs" policies.