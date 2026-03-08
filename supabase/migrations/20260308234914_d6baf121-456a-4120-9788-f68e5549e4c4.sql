ALTER TABLE public.reading_sessions
ADD COLUMN IF NOT EXISTS counselor_comment text;