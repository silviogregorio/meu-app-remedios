-- Ensure the sponsors bucket is public
update storage.buckets
set public = true
where id = 'sponsors';

-- Basic policy cleanup to avoid conflicts
drop policy if exists "Public can view sponsor logos" on storage.objects;
drop policy if exists "Admin can upload sponsor logos" on storage.objects;
drop policy if exists "Admin can update sponsor logos" on storage.objects;
drop policy if exists "Admin can delete sponsor logos" on storage.objects;

-- Re-create policies with explicit checks
create policy "Public can view sponsor logos"
  on storage.objects for select
  using ( bucket_id = 'sponsors' );

create policy "Admin can upload sponsor logos"
  on storage.objects for insert
  with check (
    bucket_id = 'sponsors' AND
    (auth.jwt() ->> 'email' = 'sigsis@gmail.com')
  );

create policy "Admin can update sponsor logos"
  on storage.objects for update
  using (
    bucket_id = 'sponsors' AND
    (auth.jwt() ->> 'email' = 'sigsis@gmail.com')
  );

create policy "Admin can delete sponsor logos"
  on storage.objects for delete
  using (
    bucket_id = 'sponsors' AND
    (auth.jwt() ->> 'email' = 'sigsis@gmail.com')
  );

-- Double check table policies too (just in case)
drop policy if exists "Admin can do everything" on public.sponsors;
create policy "Admin can do everything"
  on public.sponsors for all
  using (auth.jwt() ->> 'email' = 'sigsis@gmail.com')
  with check (auth.jwt() ->> 'email' = 'sigsis@gmail.com');
