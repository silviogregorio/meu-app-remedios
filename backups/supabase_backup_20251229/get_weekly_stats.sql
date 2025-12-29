-- ========================================
-- FUNÇÃO SQL OTIMIZADA PARA RESUMO SEMANAL
-- ========================================
-- Retorna todas as estatísticas em UMA ÚNICA QUERY
-- Escalável para centenas de usuários

CREATE OR REPLACE FUNCTION get_weekly_stats(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  patient_id UUID,
  patient_name TEXT,
  owner_email TEXT,
  caregiver_email TEXT,
  caregiver_name TEXT,
  expected_doses BIGINT,
  taken_doses BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- 1. Buscar todos os pacientes e seus cuidadores
  patient_caregivers AS (
    SELECT DISTINCT
      p.id AS patient_id,
      p.name AS patient_name,
      p.user_id AS owner_id,
      u1.email AS owner_email,
      u1.raw_user_meta_data->>'full_name' AS owner_name,
      COALESCE(ps.shared_with_email, u1.email) AS caregiver_email,
      COALESCE(
        u2.raw_user_meta_data->>'full_name',
        ps.shared_with_email
      ) AS caregiver_name
    FROM patients p
    INNER JOIN auth.users u1 ON p.user_id = u1.id
    LEFT JOIN patient_shares ps ON p.id = ps.patient_id AND ps.accepted_at IS NOT NULL
    LEFT JOIN profiles pr ON ps.shared_with_email = pr.email
    LEFT JOIN auth.users u2 ON pr.id = u2.id
  ),
  
  -- 2. Calcular doses esperadas no período
  expected_doses_calc AS (
    SELECT 
      pr.patient_id,
      SUM(
        CASE 
          WHEN pr.times IS NOT NULL 
          THEN array_length(pr.times, 1) * (
            EXTRACT(DAY FROM (p_end_date - p_start_date)) + 1
          )
          ELSE 0
        END
      ) AS expected_total
    FROM prescriptions pr
    WHERE 
      pr.active <> false
      AND (pr.end_date IS NULL OR pr.end_date >= p_start_date)
      AND pr.start_date <= p_end_date
    GROUP BY pr.patient_id
  ),
  
  -- 3. Calcular doses tomadas no período
  taken_doses_calc AS (
    SELECT 
      pr.patient_id,
      COUNT(cl.id) AS taken_total
    FROM consumption_log cl
    INNER JOIN prescriptions pr ON cl.prescription_id = pr.id
    WHERE 
      cl.date >= p_start_date
      AND cl.date <= p_end_date
    GROUP BY pr.patient_id
  )
  
  -- 4. Juntar tudo e retornar
  SELECT 
    pc.patient_id,
    pc.patient_name,
    pc.owner_email,
    pc.caregiver_email,
    pc.caregiver_name,
    COALESCE(ed.expected_total, 0) AS expected_doses,
    COALESCE(td.taken_total, 0) AS taken_doses
  FROM patient_caregivers pc
  LEFT JOIN expected_doses_calc ed ON pc.patient_id = ed.patient_id
  LEFT JOIN taken_doses_calc td ON pc.patient_id = td.patient_id
  WHERE COALESCE(ed.expected_total, 0) > 0  -- Apenas pacientes com prescrições ativas
  ORDER BY pc.caregiver_email, pc.patient_name;
  
END;
$$;

-- ========================================
-- TABELA DE LOG DE ENVIOS
-- ========================================
CREATE TABLE IF NOT EXISTS weekly_report_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  users_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_weekly_report_logs_date 
  ON weekly_report_logs(report_date DESC);

-- Comentários
COMMENT ON FUNCTION get_weekly_stats IS 'Retorna estatísticas semanais otimizadas para todos os pacientes e cuidadores';
COMMENT ON TABLE weekly_report_logs IS 'Log de envios de resumos semanais para auditoria';

-- ========================================
-- GRANT PERMISSIONS (Service Role)
-- ========================================
-- A função roda com SECURITY DEFINER, então não precisa de RLS
-- Mas garantir que service role pode executar
GRANT EXECUTE ON FUNCTION get_weekly_stats TO service_role;
