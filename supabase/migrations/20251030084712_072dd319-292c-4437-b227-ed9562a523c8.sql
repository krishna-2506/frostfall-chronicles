-- Remove Google Tasks integration
DROP TABLE IF EXISTS google_tokens;

-- Remove google_task_id column from mission_tasks
ALTER TABLE mission_tasks DROP COLUMN IF EXISTS google_task_id;