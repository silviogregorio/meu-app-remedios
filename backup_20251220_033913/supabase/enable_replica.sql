-- Ensure Realtime receives all columns on updates, not just changed ones
ALTER TABLE public.sponsors REPLICA IDENTITY FULL;

-- Double check RLS for anon (optional but good specific for Landing)
-- Ensure 'anon' can SELECT active sponsors. 
-- Note: Realtime respects RLS. If RLS hides the row, 'UPDATE' might not be sent or sent as DELETE.
-- We want to ensure that if a sponsor is updated, we get the event.
