-- SECURITY & PRIVACY ENFORCEMENT SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- This script ensures valid data matches strictly: "Owner ONLY" OR "Shared Guest ONLY".
-- No public access allowed.

-- 1. FORCE RLS ON ALL TABLES (The "Locked Doors")
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_shares ENABLE ROW LEVEL SECURITY;

-- 2. PRIVACY POLICIES (The "Bouncer Check")

-- We ensure the helper function exists and is secure (Security Definer)
-- This function is the ONLY way to see data: Either you own it, or it was shared with your email.
CREATE OR REPLACE FUNCTION public.check_access(resource_owner_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        auth.uid() = resource_owner_id -- Case A: It's mine
        OR
        EXISTS ( -- Case B: It was shared with me
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            AND lower(shared_with_email) = lower(auth.jwt() ->> 'email')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY STRICT POLICIES
-- We drop old policies to ensure no "leaks" remain.

-- PATIENTS
DROP POLICY IF EXISTS "Acesso Total" ON patients;
DROP POLICY IF EXISTS "Acesso Total Unificado Pacientes" ON patients;
DROP POLICY IF EXISTS "Acesso Compartilhado Pacientes" ON patients;
-- This policy handles BOTH Select (View) and Insert/Update (Edit)
CREATE POLICY "Strict Privacy Policy - Patients" ON patients FOR ALL USING (public.check_access(user_id));

-- MEDICATIONS
DROP POLICY IF EXISTS "Acesso Total" ON medications;
DROP POLICY IF EXISTS "Acesso Total Unificado Medicamentos" ON medications;
DROP POLICY IF EXISTS "Acesso Compartilhado Medicamentos" ON medications;
CREATE POLICY "Strict Privacy Policy - Medications" ON medications FOR ALL USING (public.check_access(user_id));

-- PRESCRIPTIONS
DROP POLICY IF EXISTS "Acesso Total" ON prescriptions;
DROP POLICY IF EXISTS "Acesso Total Unificado Receitas" ON prescriptions;
DROP POLICY IF EXISTS "Acesso Compartilhado Receitas" ON prescriptions;
CREATE POLICY "Strict Privacy Policy - Prescriptions" ON prescriptions FOR ALL USING (public.check_access(user_id));

-- CONSUMPTION LOG (Linked via Prescription)
DROP POLICY IF EXISTS "Acesso Total" ON consumption_log;
DROP POLICY IF EXISTS "Acesso Log via Receita" ON consumption_log;
DROP POLICY IF EXISTS "Acesso Compartilhado Logs" ON consumption_log;
CREATE POLICY "Strict Privacy Policy - Logs" ON consumption_log FOR ALL USING (
    EXISTS (
        SELECT 1 FROM prescriptions
        WHERE id = consumption_log.prescription_id
        AND public.check_access(prescriptions.user_id)
    )
);

-- 4. REVOKE ANONYMOUS ACCESS
-- Double check: Anonymous users (not logged in) cannot do anything.
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.medications FROM anon;
REVOKE ALL ON public.prescriptions FROM anon;
REVOKE ALL ON public.consumption_log FROM anon;
REVOKE ALL ON public.account_shares FROM anon;

SELECT 'Privacy Enforcement Complete. Data is strictly isolated to Owners and Guests.' as result;
