-- Função para buscar tokens FCM por email (Seguro para o backend usar)
CREATE OR REPLACE FUNCTION get_tokens_by_emails(p_emails text[])
RETURNS TABLE(token text) 
SECURITY DEFINER -- Roda com privilégios de admin para ignorar RLS e encontrar tokens
AS $$
BEGIN
    RETURN QUERY
    SELECT t.token
    FROM fcm_tokens t
    JOIN profiles p ON t.user_id = p.id
    WHERE p.email = ANY(p_emails);
END;
$$ LANGUAGE plpgsql;

-- Garante que apenas usuários autenticados (ou o backend) possam chamar
GRANT EXECUTE ON FUNCTION get_tokens_by_emails(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tokens_by_emails(text[]) TO service_role;
