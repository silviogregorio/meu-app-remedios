-- Add accessibility_settings column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'accessibility_settings'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN accessibility_settings JSONB DEFAULT '{"highContrast": false, "largeText": false, "voiceEnabled": false}'::jsonb;
    END IF;
END $$;
