-- Drop the incorrect unique constraint on value only
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_value_key;

-- Add correct unique constraint on user_id + value combination
ALTER TABLE public.categories ADD CONSTRAINT categories_user_value_unique UNIQUE (user_id, value);