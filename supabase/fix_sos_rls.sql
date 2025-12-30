-- FIX SOS RLS and Acknowledgment Permissions
-- This script ensures anyone can view and update alerts in the dev environment.

-- 1. Drop old restrictive policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Caregivers can view alerts" ON sos_alerts;
DROP POLICY IF EXISTS "Public test alerts" ON sos_alerts;
DROP POLICY IF EXISTS "Users can view alerts for accessible patients" ON sos_alerts;
DROP POLICY IF EXISTS "Users can trigger alerts" ON sos_alerts;

-- 2. Create permissive policies for testing
-- SELECT: Anyone logged in can see alerts
CREATE POLICY "Anyone can view alerts" ON sos_alerts
FOR SELECT USING (true);

-- INSERT: Anyone logged in can trigger alerts
CREATE POLICY "Anyone can trigger alerts" ON sos_alerts
FOR INSERT WITH CHECK (true);

-- UPDATE: Anyone logged in can acknowledge alerts
CREATE POLICY "Anyone can acknowledge alerts" ON sos_alerts
FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Ensure Realtime is on
ALTER TABLE sos_alerts REPLICA IDENTITY FULL;
-- Try to add to publication (might already be there)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'sos_alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication or other minor issue
    RAISE NOTICE 'Skipping publication add: %', SQLERRM;
END $$;
