-- Add last_alert_date to medications table to throttle emails
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS last_alert_date DATE DEFAULT NULL;

-- Comment on column
COMMENT ON COLUMN public.medications.last_alert_date IS 'Data do último alerta de estoque baixo enviado para evitar spam';
