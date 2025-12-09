-- NUCLEAR OPTION: RESET POLICIES COMPLETELY

-- 1. Unbloat patient_shares
ALTER TABLE patient_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver shares" ON patient_shares;
DROP POLICY IF EXISTS "Dono gerencia" ON patient_shares;
DROP POLICY IF EXISTS "Convidado ve" ON patient_shares;
DROP POLICY IF EXISTS "Convidado aceita" ON patient_shares;
DROP POLICY IF EXISTS "Admin full access" ON patient_shares;

-- Allow authenticated users to see shares where they are the owner OR the target
CREATE POLICY "Unified Share Access"
    ON patient_shares FOR ALL
    USING (
        auth.uid() = owner_id OR 
        auth.uid() = shared_with_id OR
        lower(shared_with_email) = lower((select email from auth.users where id = auth.uid()))
    );

-- 2. Reset Patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own patients" ON patients;
DROP POLICY IF EXISTS "Ver pacientes compartilhados" ON patients;
DROP POLICY IF EXISTS "Dono ve tudo" ON patients;
DROP POLICY IF EXISTS "Compartilhado ve" ON patients;

CREATE POLICY "Dono ve seus pacientes"
    ON patients FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Convidado ve pacientes"
    ON patients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = patients.id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower((select email from auth.users where id = auth.uid()))
            )
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 3. Force Update shared_with_id again (Case Insensitive)
UPDATE public.patient_shares
SET shared_with_id = users.id
FROM auth.users
WHERE lower(public.patient_shares.shared_with_email) = lower(users.email)
AND public.patient_shares.shared_with_id IS NULL;
