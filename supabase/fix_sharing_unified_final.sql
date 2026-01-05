-- ==============================================================================
-- SCRIPT MESTRE: UNIFICAÇÃO DE COMPARTILHAMENTO E SEGURANÇA ELITE (RLS) - FIX V2.1
-- Correção: Erro de coluna "user_id" inexistente em sos_alerts e otimização.
-- ==============================================================================

BEGIN;

-- 1. EXTENSÃO DA TABELA account_shares (Idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='account_shares' AND column_name='status') THEN
        ALTER TABLE public.account_shares ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='account_shares' AND column_name='accepted_at') THEN
        ALTER TABLE public.account_shares ADD COLUMN accepted_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='account_shares' AND column_name='shared_with_id') THEN
        ALTER TABLE public.account_shares ADD COLUMN shared_with_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. FUNÇÕES HELPER DE ACESSO (Otimizadas)

-- Auxiliar: Verifica acesso total à conta
CREATE OR REPLACE FUNCTION public.check_account_access(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- 1. É o próprio dono?
    IF target_user_id = auth.uid() THEN
        RETURN true;
    END IF;

    -- 2. Verificar compartilhamento de conta aceito
    RETURN EXISTS (
        SELECT 1 FROM public.account_shares
        WHERE owner_id = target_user_id
        AND (lower(shared_with_email) = lower(auth.jwt() ->> 'email') OR shared_with_id = auth.uid())
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auxiliar: Verifica acesso a paciente específico
CREATE OR REPLACE FUNCTION public.check_patient_access(target_patient_id uuid)
RETURNS boolean AS $$
DECLARE
    patient_owner_id uuid;
BEGIN
    -- Pegar dono do paciente
    SELECT user_id INTO patient_owner_id FROM public.patients WHERE id = target_patient_id;
    
    -- 1. Acesso via conta completa?
    IF public.check_account_access(patient_owner_id) THEN
        RETURN true;
    END IF;

    -- 2. Acesso via compartilhamento de paciente específico?
    RETURN EXISTS (
        SELECT 1 FROM public.patient_shares
        WHERE patient_id = target_patient_id
        AND (lower(shared_with_email) = lower(auth.jwt() ->> 'email') OR shared_with_id = auth.uid())
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. LIMPEZA DE POLÍTICAS ANTIGAS
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('patients', 'medications', 'prescriptions', 'consumption_log', 'health_logs', 'symptom_logs', 'medical_appointments', 'sos_alerts', 'account_shares', 'patient_shares')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. APLICAÇÃO DE POLÍTICAS (RLS)

-- --- account_shares & patient_shares ---
ALTER TABLE public.account_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AS_Owner_Manage" ON public.account_shares FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "AS_Receiver_View" ON public.account_shares FOR SELECT USING (lower(shared_with_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "AS_Receiver_Respond" ON public.account_shares FOR UPDATE USING (lower(shared_with_email) = lower(auth.jwt() ->> 'email')) WITH CHECK (lower(shared_with_email) = lower(auth.jwt() ->> 'email'));

ALTER TABLE public.patient_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PS_Owner_Manage" ON public.patient_shares FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "PS_Receiver_View" ON public.patient_shares FOR SELECT USING (lower(shared_with_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "PS_Receiver_Respond" ON public.patient_shares FOR UPDATE USING (lower(shared_with_email) = lower(auth.jwt() ->> 'email')) WITH CHECK (lower(shared_with_email) = lower(auth.jwt() ->> 'email'));

-- --- patients ---
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients_Access" ON public.patients FOR ALL 
USING (public.check_account_access(user_id) OR public.check_patient_access(id));

-- --- medications ---
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medications_Access" ON public.medications FOR ALL 
USING (public.check_account_access(user_id));

-- --- prescriptions ---
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prescriptions_Access" ON public.prescriptions FOR SELECT 
USING (public.check_patient_access(patient_id));

CREATE POLICY "Prescriptions_Manage" ON public.prescriptions FOR ALL 
USING (public.check_account_access(user_id));

-- --- consumption_log ---
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Log_Access" ON public.consumption_log FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.prescriptions 
        WHERE id = consumption_log.prescription_id 
        AND public.check_patient_access(patient_id)
    )
);

-- --- health_logs & symptom_logs ---
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HealthLogs_Access" ON public.health_logs FOR ALL 
USING (public.check_patient_access(patient_id)); -- health_logs TEM patient_id

ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SymptomLogs_Access" ON public.symptom_logs FOR ALL 
USING (public.check_account_access(user_id)); -- symptom_logs usa user_id do perfil

-- --- medical_appointments (Consultas) ---
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Appointments_Access" ON public.medical_appointments FOR ALL 
USING (public.check_patient_access(patient_id)); -- medical_appointments TEM patient_id

-- --- sos_alerts ---
-- CORREÇÃO: sos_alerts NÃO tem user_id, usa patient_id.
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SOS_Access" ON public.sos_alerts FOR ALL 
USING (public.check_patient_access(patient_id));

COMMIT;

SELECT '📡 SISTEMA DE SEGURANÇA E COMPARTILHAMENTO UNIFICADO ATUALIZADO (V2.1 - FIX)' as status;
