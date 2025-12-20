-- ==============================================================================
-- FIX JOIN PROFILES (Erro PGRST200)
-- ==============================================================================
-- O frontend tenta buscar "owner:profiles!owner_id".
-- Isso exige que exista uma Foreign Key explícita de patient_shares.owner_id
-- para a tabela public.profiles.
-- Atualmente, ela aponta para auth.users, o que bloqueia o acesso via API pública.

BEGIN;

-- 1. Remove a constraint antiga (que aponta para auth.users)
-- O nome pode variar, então tentamos dropar pelo nome padrão ou genérico se soubéssemos,
-- mas aqui vamos recriar garantindo o nome correto.
DO $$
BEGIN
    If EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patient_shares_owner_id_fkey') THEN
        ALTER TABLE public.patient_shares DROP CONSTRAINT patient_shares_owner_id_fkey;
    END IF;
END $$;

-- 2. Adiciona a nova constraint apontando para public.profiles
ALTER TABLE public.patient_shares
ADD CONSTRAINT patient_shares_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Recarrega o cache do Schema (o Supabase faz isso no commit, mas bom garantir)
NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT '✅ Relacionamento corrigido: owner_id agora aponta para profiles.' as status;
