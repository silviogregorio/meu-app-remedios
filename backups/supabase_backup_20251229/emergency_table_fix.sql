-- SCRIPT DE CORREÇÃO DEFINITIVA (CLEAN SLATE)
-- Este script resolve o erro "column does not exist" limpando tudo antes de recriar.

BEGIN; -- Inicia transação segura

-- 1. Remover Políticas que podem estar referenciando a tabela antiga
-- Isso evita que o banco tente validar regras em colunas que não existem mais.
DROP POLICY IF EXISTS "Ver Pacientes (Dono e Família)" ON public.patients;
DROP POLICY IF EXISTS "Ver Medicamentos (Dono e Família)" ON public.medications;
DROP POLICY IF EXISTS "Ver Receitas (Dono e Família)" ON public.prescriptions;
DROP POLICY IF EXISTS "Ver Histórico (Dono e Família)" ON public.consumption_log;

-- 2. Remover Funções auxiliares
DROP FUNCTION IF EXISTS public.has_patient_access;

-- 3. Remover a Tabela (ASCADE garante que limpa referências)
DROP TABLE IF EXISTS public.patient_shares CASCADE;

-- 4. Criar a Tabela NOVA (Estrutura Completa)
CREATE TABLE public.patient_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    shared_with_email text not null,
    permission text default 'view',     -- Coluna de permissão
    status text default 'pending',      -- Coluna de status (que estava faltando)
    created_at timestamptz default now(),
    accepted_at timestamptz
);

-- 5. Adicionar restrição única (Um convite por email por paciente)
ALTER TABLE public.patient_shares 
ADD CONSTRAINT unique_patient_share UNIQUE (patient_id, shared_with_email);

-- 6. Habilitar Segurança RLS
ALTER TABLE public.patient_shares ENABLE ROW LEVEL SECURITY;

COMMIT; -- Confirma as mudanças

SELECT 'Sucesso! Tabela recriada. Agora o erro de coluna deve desaparecer.' as status;
