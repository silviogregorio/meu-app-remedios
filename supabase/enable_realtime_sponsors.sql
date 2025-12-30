-- 1. Ensure REPLICA IDENTITY is FULL (Enables full data in Realtime even with RLS)
alter table public.sponsors replica identity full;

-- 2. Safe addition to publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'sponsors'
  ) then
    alter publication supabase_realtime add table sponsors;
  end if;
end $$;

