-- Enable Full Replica Identity for patient_shares
-- This ensures that when a row is deleted, the OLD record contains all columns,
-- allowing Realtime filters (like shared_with_email=...) to work correctly.

ALTER TABLE patient_shares REPLICA IDENTITY FULL;

-- Verification (Optional comment, not code)
-- After this run, DELETE events sent to Supabase Realtime will include the full 'old' record.
