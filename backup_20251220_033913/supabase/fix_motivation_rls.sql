-- Adiciona suporte para UPDATE na tabela de mensagens lidas
-- Necessário para que o comando .upsert() do Supabase funcione corretamente
CREATE POLICY "Users can update their own seen logs"
    ON user_seen_messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Garante que o SELECT também cubra todos os casos
DROP POLICY IF EXISTS "Users can select their own seen logs" ON user_seen_messages;
CREATE POLICY "Users can select their own seen logs"
    ON user_seen_messages FOR SELECT
    USING (auth.uid() = user_id);
