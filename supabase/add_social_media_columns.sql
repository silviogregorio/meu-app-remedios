-- Add social media columns to sponsors table
alter table public.sponsors 
add column if not exists whatsapp text,
add column if not exists tiktok text,
add column if not exists youtube text,
add column if not exists instagram text,
add column if not exists facebook text;
