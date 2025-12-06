-- FIX REALTIME CONFIGURATION
-- Run this in Supabase SQL Editor

-- 1. Ensure the table is part of the realtime publication
alter publication supabase_realtime add table public.sponsors;

-- 2. Set Replica Identity to FULL to ensure we get all data in payloads (critical for DELETE/UPDATE)
alter table public.sponsors replica identity full;

-- 3. Double check RLS (ensure public can read active)
-- (This policy is already likely correct, but ensuring no other policy blocks it)
drop policy if exists "Public can view active sponsors" on public.sponsors;
create policy "Public can view active sponsors"
  on public.sponsors for select
  using (active = true);

-- 4. Verify publication
select * from pg_publication_tables where pubname = 'supabase_realtime';
