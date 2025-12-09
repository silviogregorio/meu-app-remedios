-- ENFORCE EDIT PERMISSIONS
-- Users with 'view' permission should NOT be able to UPDATE or DELETE.

-- 1. Policies for PATIENTS
DROP POLICY IF EXISTS "Dono edita pacientes" ON patients;
DROP POLICY IF EXISTS "Convidado edita pacientes" ON patients;

-- 1.1 Owner (Full Access)
CREATE POLICY "Owner manages patients"
    ON patients FOR ALL
    USING (user_id = auth.uid());

-- 1.2 Shared User (UPDATE only if permission='edit')
CREATE POLICY "Shared editor updates patients"
    ON patients FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = patients.id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit' -- CRITICAL CHECK
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 1.3 Shared User (DELETE? Usually shared users cannot delete the patient itself, only the owner)
-- We will NOT create a DELETE policy for shared users. Only owner can delete.


-- 2. Policies for MEDICATIONS (inherits permission from patient)
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages medications" ON medications;
DROP POLICY IF EXISTS "Shared editor manages medications" ON medications;

CREATE POLICY "Owner manages medications"
    ON medications FOR ALL
    USING (
        EXISTS ( SELECT 1 FROM patients WHERE patients.id = medications.patient_id AND patients.user_id = auth.uid() )
    );

CREATE POLICY "Shared editor manages medications"
    ON medications FOR ALL -- Update/Insert/Delete allowed if 'edit'
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = medications.patient_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit'
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 3. Policies for PRESCRIPTIONS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Shared editor manages prescriptions" ON prescriptions;

CREATE POLICY "Owner manages prescriptions"
    ON prescriptions FOR ALL
    USING (
        EXISTS ( SELECT 1 FROM patients WHERE patients.id = prescriptions.patient_id AND patients.user_id = auth.uid() )
    );

CREATE POLICY "Shared editor manages prescriptions"
    ON prescriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = prescriptions.patient_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit'
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 4. Policies for CONSUMPTION_LOG (Taking meds)
ALTER TABLE consumption_log ENABLE ROW LEVEL SECURITY;
-- Usually "View" users cannot log consumption? Or can they? 
-- Assumption: "View" = Read Only. "Exibir". No touching.
-- So Logging requires 'edit' permission.

DROP POLICY IF EXISTS "Owner manages log" ON consumption_log;
DROP POLICY IF EXISTS "Shared editor manages log" ON consumption_log;

CREATE POLICY "Owner manages log"
    ON consumption_log FOR ALL
    USING (
        EXISTS ( 
            SELECT 1 FROM prescriptions 
            JOIN patients ON patients.id = prescriptions.patient_id
            WHERE prescriptions.id = consumption_log.prescription_id 
            AND patients.user_id = auth.uid() 
        )
    );

CREATE POLICY "Shared editor manages log"
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
            AND patient_shares.permission = 'edit'
            AND patient_shares.accepted_at IS NOT NULL
        )
    );
