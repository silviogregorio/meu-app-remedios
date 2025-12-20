-- Enable Realtime Broadcast for patient_shares
-- CRITICAL: Without this, Supabase will NOT send any events for this table
-- to the WebSocket clients, regardless of RLS or Replica Identity.

BEGIN;
  -- Add table to publication if not already present
  -- (Using a safe approach to avoid errors if already present, though simple add usually works)
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    patients, 
    medications, 
    prescriptions, 
    consumption_log, 
    patient_shares;
COMMIT;

-- Verify
-- select * from pg_publication_tables where pubname = 'supabase_realtime';
