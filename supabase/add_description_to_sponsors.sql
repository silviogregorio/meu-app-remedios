-- Add description column to sponsors table
alter table public.sponsors 
add column if not exists description text;
