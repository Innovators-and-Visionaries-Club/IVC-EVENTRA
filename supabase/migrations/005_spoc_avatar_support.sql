-- 005_spoc_avatar_support.sql
-- Add avatar_url to spocs table if it does not already exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'spocs'
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.spocs ADD COLUMN avatar_url TEXT;
    END IF;
END $$;
