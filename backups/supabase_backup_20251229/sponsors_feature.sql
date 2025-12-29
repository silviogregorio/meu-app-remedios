-- Create the sponsors table
create table if not exists public.sponsors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo_url text not null,
  website_url text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.sponsors enable row level security;

-- Create policies

-- Everyone can view active sponsors
create policy "Public can view active sponsors"
  on public.sponsors for select
  using (active = true);

-- Only specific admin email can insert/update/delete
-- Note: This relies on the email being present in the JWT.
create policy "Admin can do everything"
  on public.sponsors for all
  using (
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  )
  with check (
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  );

-- Create storage bucket for sponsor logos
insert into storage.buckets (id, name, public)
values ('sponsors', 'sponsors', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public can view sponsor logos"
  on storage.objects for select
  using ( bucket_id = 'sponsors' );

create policy "Admin can upload sponsor logos"
  on storage.objects for insert
  with check (
    bucket_id = 'sponsors' AND
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  );

create policy "Admin can update sponsor logos"
  on storage.objects for update
  using (
    bucket_id = 'sponsors' AND
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  );

create policy "Admin can delete sponsor logos"
  on storage.objects for delete
  using (
    bucket_id = 'sponsors' AND
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  );
