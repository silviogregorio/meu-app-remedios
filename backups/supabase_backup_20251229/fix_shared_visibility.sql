-- FIX Shared Data Visibility (CORRECTED)
-- 1. READ (SELECT): Allow 'view' OR 'edit'
-- 2. WRITE (INSERT/UPDATE/DELETE): Allow ONLY 'edit'

-- 1. MEDICATIONS (Vinculados ao Dono, não ao Paciente)
DROP POLICY IF EXISTS "Shared editor manages medications" ON medications;
DROP POLICY IF EXISTS "Shared user views medications" ON medications;
DROP POLICY IF EXISTS "Shared editor modifies medications" ON medications;

CREATE POLICY "Shared user views medications"
    ON medications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.owner_id = medications.user_id -- LINK VIA OWNER
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Shared editor modifies medications"
    ON medications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.owner_id = medications.user_id -- LINK VIA OWNER
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit' -- STRICT
            AND patient_shares.accepted_at IS NOT NULL
        )
    );


-- 2. PRESCRIPTIONS (Esses têm patient_id)
DROP POLICY IF EXISTS "Shared editor manages prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Shared user views prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Shared editor modifies prescriptions" ON prescriptions;

CREATE POLICY "Shared user views prescriptions"
    ON prescriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = prescriptions.patient_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Shared editor modifies prescriptions"
    ON prescriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = prescriptions.patient_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit' -- STRICT
            AND patient_shares.accepted_at IS NOT NULL
        )
    );


-- 3. CONSUMPTION LOG
DROP POLICY IF EXISTS "Shared editor manages log" ON consumption_log;
DROP POLICY IF EXISTS "Shared user views log" ON consumption_log;
DROP POLICY IF EXISTS "Shared editor modifies log" ON consumption_log;

CREATE POLICY "Shared user views log"
    ON consumption_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM prescriptions
            JOIN patient_shares ON patient_shares.patient_id = prescriptions.patient_id
            WHERE prescriptions.id = consumption_log.prescription_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Shared editor modifies log"
    ON consumption_log FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM prescriptions
            JOIN patient_shares ON patient_shares.patient_id = prescriptions.patient_id
            WHERE prescriptions.id = consumption_log.prescription_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit' -- STRICT
            AND patient_shares.accepted_at IS NOT NULL
        )
    );
