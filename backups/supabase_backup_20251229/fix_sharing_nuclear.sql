-- ==============================================================================
-- SCRIPT NUCLEAR V2: SOLUÇÃO PARA O ERRO DE PARSE
-- ==============================================================================
-- O problema: O Supabase verifica se as colunas existem ANTES de rodar o script.
-- Como a tabela 'patient_shares' antiga está errada, ele trava.
-- Solução: Usamos EXECUTE (SQL Dinâmico) para esconder os comandos do verificador.

BEGIN;

DO $$
BEGIN
    -- 1. LIMPEZA TOTAL (Sem depender de colunas existirem)
    -- Removemos tudo que possa travar
    EXECUTE 'DROP TABLE IF EXISTS public.patient_shares CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS public.has_patient_access CASCADE';
    
    -- Limpa políticas antigas de outras tabelas para garantir
    EXECUTE 'DROP POLICY IF EXISTS "Ver Pacientes (Dono e Família)" ON public.patients';
    EXECUTE 'DROP POLICY IF EXISTS "Ver Medicamentos (Dono e Família)" ON public.medications';
    EXECUTE 'DROP POLICY IF EXISTS "Ver Receitas (Dono e Família)" ON public.prescriptions';
    EXECUTE 'DROP POLICY IF EXISTS "Ver Histórico (Dono e Família)" ON public.consumption_log';

    -- 2. RECRIAR TABELA (Agora o Postgres sabe que ela existe nesta transação)
    CREATE TABLE public.patient_shares (
        id uuid default gen_random_uuid() primary key,
        owner_id uuid references auth.users(id) not null,
        patient_id uuid references public.patients(id) on delete cascade not null,
        shared_with_email text not null,
        permission text default 'view',
        status text default 'pending',
        created_at timestamptz default now(),
        accepted_at timestamptz,
        unique(patient_id, shared_with_email)
    );

    ALTER TABLE public.patient_shares ENABLE ROW LEVEL SECURITY;

    -- 3. RECRIAR FUNÇÃO HELPER
    EXECUTE $func$
    CREATE OR REPLACE FUNCTION public.has_patient_access(target_patient_id uuid)
    RETURNS boolean AS $inner$
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
    $inner$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$;

    -- 4. APLICAR POLÍTICAS (Dynamic SQL para enganar o parser)
    
    -- patient_shares
    EXECUTE 'CREATE POLICY "Dono gerencia convites" ON public.patient_shares FOR ALL USING (auth.uid() = owner_id)';
    EXECUTE 'CREATE POLICY "Convidado vê seus convites" ON public.patient_shares FOR SELECT USING (lower(shared_with_email) = lower(auth.jwt() ->> ''email''))';
    EXECUTE 'CREATE POLICY "Convidado aceita convites" ON public.patient_shares FOR UPDATE USING (lower(shared_with_email) = lower(auth.jwt() ->> ''email''))';

    -- patients
    EXECUTE 'ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Ver Pacientes (Dono e Família)" ON public.patients FOR SELECT USING (user_id = auth.uid() OR exists (select 1 from public.patient_shares where patient_id = patients.id and lower(shared_with_email) = lower(auth.jwt() ->> ''email'') and status = ''accepted''))';
    
    -- medications
    EXECUTE 'ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY';
    -- ERRO CORRIGIDO: Medicamentos não têm patient_id. O acesso é liberado se você é convidado do DONO do medicamento (user_id).
    EXECUTE 'CREATE POLICY "Ver Medicamentos (Dono e Família)" ON public.medications FOR SELECT USING (
        user_id = auth.uid() 
        OR 
        exists (select 1 from public.patient_shares where owner_id = medications.user_id and lower(shared_with_email) = lower(auth.jwt() ->> ''email'') and status = ''accepted'')
    )';

    -- prescriptions
    EXECUTE 'ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Ver Receitas (Dono e Família)" ON public.prescriptions FOR SELECT USING (public.has_patient_access(patient_id))';

    -- consumption_log
    EXECUTE 'ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Ver Histórico (Dono e Família)" ON public.consumption_log FOR SELECT USING (
        exists (
            select 1 from public.prescriptions 
            where id = consumption_log.prescription_id 
            and public.has_patient_access(prescriptions.patient_id)
        )
    )';

END $$;

COMMIT;

SELECT '✅ AGORA VAI! Estrutura recriada e blindada.' as status;
