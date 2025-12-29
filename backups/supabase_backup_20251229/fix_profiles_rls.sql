-- ==============================================================================
-- FIX: PERMISSÕES DE PERFIL (RLS)
-- Garante que o usuário possa LER e EDITAR seu próprio perfil
-- ==============================================================================

BEGIN;

-- 1. Habilita RLS na tabela profiles (caso não esteja)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas (para evitar conflitos/duplicidade)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 3. Cria política de LEITURA (SELECT)
-- Permite que o usuário veja APENAS seu próprio perfil (mais seguro)
-- OU permite que veja todos se for necessário para funcionalidades sociais (ex: compartilhar)
-- Por enquanto, vamos permitir ver o PRÓPRIO.
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4. Cria política de ATUALIZAÇÃO (UPDATE)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. Cria política de INSERÇÃO (INSERT) - Caso o trigger de createUser falhe
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

COMMIT;

SELECT '✅ Políticas de Segurança (RLS) do Perfil corrigidas!' as status;
