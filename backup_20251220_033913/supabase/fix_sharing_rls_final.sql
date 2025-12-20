-- MELHORIA: Usar shared_with_id (mais seguro/rápido) em vez de subquery de email

-- 1. Política para ver Pacientes via Compartilhamento (patient_shares)
DROP POLICY IF EXISTS "Ver pacientes compartilhados" ON patients;
CREATE POLICY "Ver pacientes compartilhados"
    ON patients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = patients.id
            AND (
                -- Verificação híbrida para garantir retrocompatibilidade momentânea + futuro ideal
                patient_shares.shared_with_id = auth.uid()
            )
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 2. Política para ver Medicamentos
DROP POLICY IF EXISTS "Ver medicamentos de pacientes compartilhados" ON medications;
CREATE POLICY "Ver medicamentos de pacientes compartilhados"
    ON medications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = medications.patient_id
            AND patient_shares.shared_with_id = auth.uid()
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 3. Política para ver Receitas
DROP POLICY IF EXISTS "Ver receitas de pacientes compartilhados" ON prescriptions;
CREATE POLICY "Ver receitas de pacientes compartilhados"
    ON prescriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = prescriptions.patient_id
            AND patient_shares.shared_with_id = auth.uid()
            AND patient_shares.accepted_at IS NOT NULL
        )
    );

-- 4. Política para ver Consumo
DROP POLICY IF EXISTS "Ver log de pacientes compartilhados" ON consumption_log;
CREATE POLICY "Ver log de pacientes compartilhados"
    ON consumption_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM prescriptions
            JOIN patient_shares ON patient_shares.patient_id = prescriptions.patient_id
            WHERE prescriptions.id = consumption_log.prescription_id
            AND patient_shares.shared_with_id = auth.uid()
            AND patient_shares.accepted_at IS NOT NULL
        )
    );
