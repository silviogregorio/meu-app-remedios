-- Force add the column if it's missing. Run this in Supabase SQL Editor.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{"highContrast": false, "largeText": false, "voiceEnabled": false}'::jsonb;

-- Grant permissions just in case
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
