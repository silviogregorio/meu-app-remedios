-- RPC to find missed doses efficiently
CREATE OR REPLACE FUNCTION get_missed_doses(p_target_time TEXT, p_target_date DATE)
RETURNS TABLE (
    prescription_id UUID,
    medicine_name TEXT,
    patient_name TEXT,
    patient_user_id UUID,
    scheduled_time TEXT,
    dosage TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as prescription_id,
        m.name as medicine_name,
        pat.name as patient_name,
        pat.user_id as patient_user_id,
        p_target_time as scheduled_time,
        p.dose_amount as dosage
    FROM prescriptions p
    JOIN medications m ON p.medication_id = m.id
    JOIN patients pat ON p.patient_id = pat.id
    WHERE 
        p.start_date <= p_target_date 
        AND (p.end_date IS NULL OR p.end_date >= p_target_date)
        AND p.times ? p_target_time
        AND NOT EXISTS (
            SELECT 1 FROM consumption_log cl
            WHERE cl.prescription_id = p.id
              AND cl.date = p_target_date
              AND cl.scheduled_time = p_target_time
        );
END;
$$;

COMMENT ON FUNCTION get_missed_doses IS 'Identifica doses não tomadas para um horário específico de forma otimizada.';
