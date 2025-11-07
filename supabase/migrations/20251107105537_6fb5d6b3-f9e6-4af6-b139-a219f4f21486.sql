-- Add unique constraint for reflections table to support upsert
ALTER TABLE public.reflections 
ADD CONSTRAINT reflections_user_date_unique UNIQUE (user_id, date);