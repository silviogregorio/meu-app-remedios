-- Drop the restrictive policy
drop policy "Public can view active sponsors" on public.sponsors;

-- Create new policy allowing public to view all sponsors
-- This allows the client to receive Realtime updates even when 'active' changes to false
create policy "Public can view all sponsors"
  on public.sponsors for select
  using (true);
