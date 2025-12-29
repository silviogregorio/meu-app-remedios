-- ==============================================================================
-- SCRIPT DE CORREÇÃO PARA BANCO DE DADOS (SUPABASE CLOUD)
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- ==============================================================================

-- 1. Criação da tabela symptom_logs (caso não exista)
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    symptom TEXT NOT NULL,
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS e Criar Políticas para symptom_logs
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar duplicidade ao rodar novamente
DROP POLICY IF EXISTS "Users can view their own symptom logs" ON public.symptom_logs;
DROP POLICY IF EXISTS "Users can insert their own symptom logs" ON public.symptom_logs;
DROP POLICY IF EXISTS "Users can update their own symptom logs" ON public.symptom_logs;
DROP POLICY IF EXISTS "Users can delete their own symptom logs" ON public.symptom_logs;

CREATE POLICY "Users can view their own symptom logs"
    ON public.symptom_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptom logs"
    ON public.symptom_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptom logs"
    ON public.symptom_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptom logs"
    ON public.symptom_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Permissões básicas
GRANT ALL ON public.symptom_logs TO authenticated;
GRANT ALL ON public.symptom_logs TO service_role;


-- 3. Correção de Permissões para fcm_tokens (Notificações)
-- O erro 'new row violates row-level security policy' indica falta de permissão para INSERT/UPDATE

ALTER TABLE IF EXISTS public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Permitir que o usuário insira e atualize seu próprio token
DROP POLICY IF EXISTS "Users can insert their own fcm token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can update their own fcm token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can select their own fcm token" ON public.fcm_tokens;

-- Política abrangente para Insert/Select/Update/Delete baseada no user_id
CREATE POLICY "Users can manage their own fcm tokens"
    ON public.fcm_tokens
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Caso a tabela fcm_tokens não tenha user_id e use apenas o token como identificador (raro mas possível),
-- verifique a estrutura. Assumindo que tem user_id vinculado a auth.users.
