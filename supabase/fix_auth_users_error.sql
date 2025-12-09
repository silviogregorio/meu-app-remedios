-- FIX 403 ON AUTH.USERS
-- The issue is querying "auth.users" table directly in RLS. Authenticated role cannot do that.
-- We must use `auth.jwt() ->> 'email'` to get the current user's email.

-- 1. Fix patient_shares policy
DROP POLICY IF EXISTS "Emergency Write Shares" ON patient_shares;
DROP POLICY IF EXISTS "Emergency Read Shares" ON patient_shares;
DROP POLICY IF EXISTS "Unified Share Access" ON patient_shares;

CREATE POLICY "Safe Share Access"
    ON patient_shares FOR ALL
    TO authenticated
    USING (
        auth.uid() = owner_id OR 
        auth.uid() = shared_with_id OR
        -- Check email via JWT, not table join
        lower(shared_with_email) = lower(auth.jwt() ->> 'email')
    );

-- 2. Fix Patients Policy
DROP POLICY IF EXISTS "Convidado ve pacientes" ON patients;
DROP POLICY IF EXISTS "Users view own or shared patients" ON patients;

CREATE POLICY "Safe Patient Access"
    ON patients FOR SELECT
    TO authenticated
    USING (
        -- Owner
        user_id = auth.uid() 
        OR 
        -- Shared
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = patients.id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.accepted_at IS NOT NULL
        )
    );
