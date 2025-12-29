-- Add show_on_landing_page column to sponsors table
ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS show_on_landing_page BOOLEAN DEFAULT true;

-- Update existing records to default to true (or whatever logic you prefer)
UPDATE public.sponsors SET show_on_landing_page = true WHERE show_on_landing_page IS NULL;

-- Notify that we need to restart the schema cache if using PostgREST directly (Supabase handles this usually)
