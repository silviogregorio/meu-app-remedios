-- 1. Adicionar colunas de endereço
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'street') THEN
        ALTER TABLE profiles ADD COLUMN street text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'number') THEN
        ALTER TABLE profiles ADD COLUMN number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'neighborhood') THEN
        ALTER TABLE profiles ADD COLUMN neighborhood text;
    END IF;
END $$;

-- 2. Criar ou Atualizar Função RPC para buscar tokens FCM
CREATE OR REPLACE FUNCTION get_tokens_by_emails(p_emails text[])
RETURNS TABLE(token text) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.token
    FROM fcm_tokens t
    JOIN profiles p ON t.user_id = p.id
    WHERE p.email = ANY(p_emails);
END;
$$ LANGUAGE plpgsql;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION get_tokens_by_emails(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tokens_by_emails(text[]) TO service_role;
