-- Add Social Media Columns to Sponsors table

ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Update the existing Fernandópolis sponsor with sample social media links
UPDATE public.sponsors
SET 
  instagram_url = 'https://www.instagram.com/pref.fernandopolis',
  facebook_url = 'https://www.facebook.com/prefeituradefernandopolis',
  whatsapp_url = 'https://wa.me/551734650150'
WHERE ibge_code = '3515509';
