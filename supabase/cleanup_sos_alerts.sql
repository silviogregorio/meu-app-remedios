-- Verificar alertas SOS ativos
SELECT id, patient_id, status, alert_type, created_at 
FROM sos_alerts 
WHERE status = 'active'
ORDER BY created_at DESC;

-- Limpar alertas ativos antigos (marcar como expirados)
-- Execute esta query para limpar os alertas de teste:
UPDATE sos_alerts 
SET status = 'expired' 
WHERE status = 'active';

-- Conferir que foram limpos
SELECT COUNT(*) as alertas_ativos FROM sos_alerts WHERE status = 'active';
