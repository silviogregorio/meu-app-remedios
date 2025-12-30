-- Add sos_alerts to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;

-- Ensure RLS allows caregivers to see the alerts
-- We need to check existing policies first, but this is a safe addition
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sos_alerts' AND policyname = 'Caregivers can view alerts'
    ) THEN
        CREATE POLICY "Caregivers can view alerts" ON sos_alerts
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM patient_shares
                WHERE patient_id = sos_alerts.patient_id
                AND shared_with_email = auth.jwt()->>'email'
                AND status = 'accepted'
            )
            OR triggered_by = auth.uid()
        );
    END IF;
END $$;
