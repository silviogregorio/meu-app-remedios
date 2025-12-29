-- 1. Corrigir linhas antigas/quebradas populando shared_with_id baseado no email
UPDATE public.patient_shares
SET shared_with_id = users.id
FROM auth.users
WHERE public.patient_shares.shared_with_email = users.email
AND public.patient_shares.shared_with_id IS NULL;

-- 2. Garantir que o convidado possa ver seu próprio convite (Select)
DROP POLICY IF EXISTS "Convidado ver convite" ON patient_shares;
CREATE POLICY "Convidado ver convite"
    ON patient_shares FOR SELECT
    USING (
        shared_with_email = (select email from auth.users where id = auth.uid()) OR
        shared_with_id = auth.uid()
    );

-- 3. Garantir que o convidado possa ACEITAR o convite (Update)
DROP POLICY IF EXISTS "Convidado aceitar convite" ON patient_shares;
CREATE POLICY "Convidado aceitar convite"
    ON patient_shares FOR UPDATE
    USING (
        shared_with_email = (select email from auth.users where id = auth.uid()) OR
        shared_with_id = auth.uid()
    );
