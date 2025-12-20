-- Create the ad_offers table
create table if not exists public.ad_offers (
  id uuid default gen_random_uuid() primary key,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  title text not null,
  description text,
  price numeric(10,2),
  original_price numeric(10,2),
  image_url text, -- Optional: if specific product image. If null, use sponsor logo.
  whatsapp_link text, -- Override default whatsapp if needed
  clicks_count integer default 0,
  views_count integer default 0,
  active boolean default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ad_offers enable row level security;

-- Policies

-- Public can view active offers that haven't expired
create policy "Public can view active offers"
  on public.ad_offers for select
  using (
    active = true 
    and (expires_at is null or expires_at > now())
  );

-- Admin can do everything
create policy "Admin can do everything with offers"
  on public.ad_offers for all
  using (
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  )
  with check (
    auth.jwt() ->> 'email' = 'sigsis@gmail.com'
  );

-- RPC Function to safely increment clicks (without giving full update permission)
create or replace function increment_offer_clicks(offer_id uuid)
returns void
language plpgsql
security definer -- Configured as security definer to bypass RLS for the update
as $$
begin
  update public.ad_offers
  set clicks_count = clicks_count + 1
  where id = offer_id;
end;
$$;

-- RPC Function to safely increment views
create or replace function increment_offer_views(offer_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.ad_offers
  set views_count = views_count + 1
  where id = offer_id;
end;
$$;
