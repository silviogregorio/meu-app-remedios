-- Diagnostic Script for Realtime Configuration

-- 1. Check if patient_shares is in the publication
SELECT pubname, schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'patient_shares';

-- 2. Check Replica Identity
SELECT relname, relreplident 
FROM pg_class 
WHERE relname = 'patient_shares';
-- Expected: 'f' (full) or 'd' (default) - but we want 'f' for DELETEs with filters

-- 3. Check sample data for lowercase emails
SELECT id, shared_with_email, permission 
FROM patient_shares 
LIMIT 5;
