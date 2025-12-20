-- RLS Policy Update for Realtime Compatibility
-- Users need to be able to SELECT rows in 'patient_shares' where they are the 'shared_with_email' target.
-- Without this, Realtime subscriptions filtered by this column may silently fail or drop DELETE events.

DROP POLICY IF EXISTS "Ver meus compartilhamentos (Recebidos)" ON patient_shares;

CREATE POLICY "Ver meus compartilhamentos (Recebidos)"
    ON patient_shares FOR SELECT
    USING (
        -- Permite ver se o email bater com o token do usuário logado
        shared_with_email = (auth.jwt() ->> 'email')
    );

-- Grant needed permissions just in case
GRANT SELECT ON patient_shares TO authenticated;
