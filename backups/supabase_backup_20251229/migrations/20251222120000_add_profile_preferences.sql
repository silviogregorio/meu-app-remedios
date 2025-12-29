-- Add preferences columns to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'accessibility_settings') THEN
        ALTER TABLE profiles ADD COLUMN accessibility_settings JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'vacation_mode') THEN
        ALTER TABLE profiles ADD COLUMN vacation_mode BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
