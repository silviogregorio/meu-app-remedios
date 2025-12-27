-- Adicionar tipo de alerta e mensagem customizada ao SOS
ALTER TABLE public.sos_alerts 
ADD COLUMN IF NOT EXISTS alert_type text DEFAULT 'emergency',
ADD COLUMN IF NOT EXISTS message text;

COMMENT ON COLUMN public.sos_alerts.alert_type IS 'emergency (pânico) ou help_request (dúvida/ajuda)';
