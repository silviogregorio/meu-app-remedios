-- ==============================================================================
-- SCRIPT MESTRE: PORTAL DA FAMÍLIA (Correção de Schema e Segurança)
-- ==============================================================================
-- Este script usa SQL Dinâmico (DO $$) para contornar erros de "coluna não existe"
-- ao limpar as regras antigas. É a solução mais robusta possível.

BEGIN;

-- 1. LIMPEZA TOTAL (Sem erros de parser)
DO $$
BEGIN
    -- Remover políticas antigas se existirem (evita erro se a coluna não existir)
    -- Usamos EXECUTE para que o compilador não reclame se a tabela estiver quebrada agora.
    
    -- Pacientes
    EXECUTE 'DROP POLICY IF EXISTS "Ver Pacientes (Dono e Família)" ON public.patients';
    EXECUTE 'DROP POLICY IF EXISTS "Acesso Total Unificado Pacientes" ON public.patients';
    
    -- Medicamentos
    EXECUTE 'DROP POLICY IF EXISTS "Ver Medicamentos (Dono e Família)" ON public.medications';
    EXECUTE 'DROP POLICY IF EXISTS "Acesso Total Unificado Medicamentos" ON public.medications';
    
    -- Receitas
    EXECUTE 'DROP POLICY IF EXISTS "Ver Receitas (Dono e Família)" ON public.prescriptions';
    EXECUTE 'DROP POLICY IF EXISTS "Acesso Total Unificado Receitas" ON public.prescriptions';

    -- Logs
    EXECUTE 'DROP POLICY IF EXISTS "Ver Histórico (Dono e Família)" ON public.consumption_log';
    EXECUTE 'DROP POLICY IF EXISTS "Acesso Log via Receita" ON public.consumption_log';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: Erro ao limpar políticas antigas (pode ser ignorado): %', SQLERRM;
END $$;

-- 2. RESETAR TABELA DE COMPARTILHAMENTO
DROP TABLE IF EXISTS public.patient_shares CASCADE;

CREATE TABLE public.patient_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    shared_with_email text not null,
    permission text default 'view' check (permission in ('view', 'edit')),
    status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
    created_at timestamptz default now(),
    accepted_at timestamptz,
    unique(patient_id, shared_with_email)
);

ALTER TABLE public.patient_shares ENABLE ROW LEVEL SECURITY;

-- 3. RECRIAR FUNÇÃO HELPER
CREATE OR REPLACE FUNCTION public.has_patient_access(target_patient_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        exists (
            select 1 from public.patients
            where id = target_patient_id
            and user_id = auth.uid()
        )
        OR
        exists (
            select 1 from public.patient_shares
            where patient_id = target_patient_id
            and lower(shared_with_email) = lower(auth.jwt() ->> 'email')
            and status = 'accepted'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. APLICAR REGRAS DE SEGURANÇA (RLS)

-- --- patient_shares ---
CREATE POLICY "Dono gerencia convites" ON public.patient_shares FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Convidado vê seus convites" ON public.patient_shares FOR SELECT USING (lower(shared_with_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Convidado aceita convites" ON public.patient_shares FOR UPDATE USING (lower(shared_with_email) = lower(auth.jwt() ->> 'email')) WITH CHECK (lower(shared_with_email) = lower(auth.jwt() ->> 'email'));


-- --- patients ---
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver Pacientes (Dono e Família)" ON public.patients FOR SELECT USING (
    user_id = auth.uid() OR 
    exists (select 1 from public.patient_shares where patient_id = patients.id and lower(shared_with_email) = lower(auth.jwt() ->> 'email') and status = 'accepted')
);
CREATE POLICY "Gerenciar Pacientes (Apenas Dono)" ON public.patients FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); -- Simplificado INSERT/UPDATE/DELETE


-- --- medications ---
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver Medicamentos (Dono e Família)" ON public.medications FOR SELECT USING (public.has_patient_access(patient_id));

CREATE POLICY "Gerenciar Medicamentos (Apenas Dono)" ON public.medications FOR ALL USING (
    exists (select 1 from public.patients where id = medications.patient_id and user_id = auth.uid())
);


-- --- prescriptions ---
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver Receitas (Dono e Família)" ON public.prescriptions FOR SELECT USING (public.has_patient_access(patient_id));

CREATE POLICY "Gerenciar Receitas (Apenas Dono)" ON public.prescriptions FOR ALL USING (
    exists (select 1 from public.patients where id = prescriptions.patient_id and user_id = auth.uid())
);


-- --- consumption_log ---
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver Histórico (Dono e Família)" ON public.consumption_log FOR SELECT USING (
    exists (
        select 1 from public.prescriptions 
        where id = consumption_log.prescription_id 
        and public.has_patient_access(prescriptions.patient_id)
    )
);

CREATE POLICY "Gerenciar Histórico (Apenas Dono)" ON public.consumption_log FOR ALL USING (
    exists (
        select 1 from public.prescriptions 
        join public.patients on patients.id = prescriptions.patient_id
        where prescriptions.id = consumption_log.prescription_id 
        and patients.user_id = auth.uid()
    )
);

COMMIT;

SELECT '🎉 Configuração do Portal da Família CONCLUÍDA com sucesso!' as status;
