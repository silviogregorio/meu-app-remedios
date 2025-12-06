-- FIX REALTIME REPLICATION
-- Run this in Supabase SQL Editor to ensure Realtime is active for these tables.

-- 1. Create publication if it doesn't exist (standard in Supabase projects, but good to ensure)
-- (Users usually can't create publications in free tier DBs directly if they are not superuser, 
-- but Supabase exposes 'supabase_realtime' for this purpose).

-- 2. Add tables to the 'supabase_realtime' publication
-- This tells Supabase to broadcast changes from these tables.
alter publication supabase_realtime add table patients;
alter publication supabase_realtime add table medications;
alter publication supabase_realtime add table prescriptions;
alter publication supabase_realtime add table consumption_log;
alter publication supabase_realtime add table patient_shares;
alter publication supabase_realtime add table account_shares;

-- Note: If you get an error saying "relation ... is already in publication", that is GOOD. It means it is already working.
-- This script is just to guarantee they are tracked.

select 'Relatime configuration updated.' as result;
