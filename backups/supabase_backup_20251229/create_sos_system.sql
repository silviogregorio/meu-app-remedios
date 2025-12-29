-- SOS System Initialization

-- 1. Add Emergency Contact fields to Patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- 2. Create SOS Alerts Table
CREATE TABLE IF NOT EXISTS sos_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    triggered_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    location_lat double precision,
    location_lng double precision,
    accuracy double precision,
    status text DEFAULT 'active', -- active, resolved, accidental
    resolved_at timestamptz
);

-- 3. Enable RLS
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- 4. Policies for sos_alerts
-- Users can see alerts for their own patients or patients shared with them
CREATE POLICY "Users can view alerts for accessible patients" ON sos_alerts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = sos_alerts.patient_id
            AND (
                p.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM patient_shares ps
                    WHERE ps.patient_id = p.id
                    AND lower(ps.shared_with_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
                    AND ps.status = 'accepted'
                )
            )
        )
    );

-- Users can create alerts
CREATE POLICY "Users can trigger alerts" ON sos_alerts
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Documentação
COMMENT ON TABLE sos_alerts IS 'Logs de disparos do Botão de Pânico (SOS) com geolocalização.';
COMMENT ON COLUMN sos_alerts.location_lat IS 'Latitude no momento do disparo';
COMMENT ON COLUMN sos_alerts.location_lng IS 'Longitude no momento do disparo';
COMMENT ON COLUMN sos_alerts.accuracy IS 'Precisão da geolocalização em metros';
