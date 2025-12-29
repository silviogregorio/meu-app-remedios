-- ========================================================
-- BACKUP COMPLETO DO SCHEMA DO BANCO DE DADOS (SiG Remédios)
-- Data: 2025-12-29
-- Milestone: Correções de Segurança e Hardening (V2)
-- ========================================================

-- TABELAS CORE
-- patients
-- medications
-- prescriptions
-- consumption_log
-- profiles
-- account_shares
-- patient_shares
-- health_logs
-- medical_appointments (Anteriormente appointment_logs)
-- ad_offers (Anteriormente offers)
-- sponsors
-- system_settings
-- audit_logs
-- fcm_tokens
-- sos_alerts

-- 1. ESTRUTURA CORE (Exemplo de tabelas críticas)

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    blood_type TEXT,
    allergies TEXT,
    conditions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FUNÇÕES DE SEGURANÇA (Refatoradas para Maior Proteção)

CREATE OR REPLACE FUNCTION public.check_access(resource_owner_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        auth.uid() = resource_owner_id
        OR
        EXISTS (
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            AND shared_with_email = (auth.jwt() ->> 'email')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. HARDENING (MENOR PRIVILÉGIO)

-- Revogar anon
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.medications FROM anon;
REVOKE ALL ON public.prescriptions FROM anon;
REVOKE ALL ON public.consumption_log FROM anon;
REVOKE ALL ON public.account_shares FROM anon;
REVOKE ALL ON public.patient_shares FROM anon;
REVOKE ALL ON public.health_logs FROM anon;
REVOKE ALL ON public.medical_appointments FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.fcm_tokens FROM anon;
REVOKE ALL ON public.sos_alerts FROM anon;

-- Garantir authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consumption_log TO authenticated;
GRANT SELECT ON public.ad_offers TO anon, authenticated;
GRANT SELECT ON public.system_settings TO anon, authenticated;

-- 4. POLÍTICAS DE RLS (Exemplos)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own patients" ON public.patients;
CREATE POLICY "Users can manage their own patients" ON public.patients
FOR ALL TO authenticated USING (public.check_access(user_id));

SELECT 'Backup do schema gerado com sucesso para fins de documentação e restauração.' as message;
