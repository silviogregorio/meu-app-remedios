-- Add address columns to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'street') THEN
        ALTER TABLE profiles ADD COLUMN street text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'number') THEN
        ALTER TABLE profiles ADD COLUMN number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'neighborhood') THEN
        ALTER TABLE profiles ADD COLUMN neighborhood text;
    END IF;
END $$;
