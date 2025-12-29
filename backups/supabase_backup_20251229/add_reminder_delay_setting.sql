-- Add configurable reminder delay to system settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS take_reminder_delay_minutes INTEGER DEFAULT 15 CHECK (take_reminder_delay_minutes >= 1 AND take_reminder_delay_minutes <= 120);

COMMENT ON COLUMN system_settings.take_reminder_delay_minutes IS 'Minutos de atraso para disparar o lembrete "Você tomou?" (1-120)';

-- Update existing 'alerts' key if it exists
UPDATE system_settings 
SET take_reminder_delay_minutes = 15 
WHERE key = 'alerts' AND take_reminder_delay_minutes IS NULL;
