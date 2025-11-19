-- Drop the existing unique constraint on date only
ALTER TABLE public.reflections DROP CONSTRAINT IF EXISTS reflections_date_key;

-- Add a new unique constraint on the combination of date and user_id
ALTER TABLE public.reflections ADD CONSTRAINT reflections_date_user_id_key UNIQUE (date, user_id);