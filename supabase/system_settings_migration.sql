-- ====================================
-- MIGRAÇÃO: Adicionar Configurações de Resumo Semanal
-- ====================================
-- Execute este script se a tabela system_settings já existe

-- Adicionar novas colunas (se não existirem)
DO $$
BEGIN
  -- weekly_report_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' 
    AND column_name = 'weekly_report_enabled'
  ) THEN
    ALTER TABLE system_settings 
    ADD COLUMN weekly_report_enabled BOOLEAN DEFAULT true;
  END IF;

  -- weekly_report_day_of_week
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' 
    AND column_name = 'weekly_report_day_of_week'
  ) THEN
    ALTER TABLE system_settings 
    ADD COLUMN weekly_report_day_of_week INTEGER DEFAULT 1 
    CHECK (weekly_report_day_of_week >= 0 AND weekly_report_day_of_week <= 6);
  END IF;

  -- weekly_report_hour
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' 
    AND column_name = 'weekly_report_hour'
  ) THEN
    ALTER TABLE system_settings 
    ADD COLUMN weekly_report_hour INTEGER DEFAULT 9 
    CHECK (weekly_report_hour >= 0 AND weekly_report_hour <= 23);
  END IF;
END $$;

-- Atualizar registro existente com valores padrão (se necessário)
UPDATE system_settings 
SET 
  weekly_report_enabled = COALESCE(weekly_report_enabled, true),
  weekly_report_day_of_week = COALESCE(weekly_report_day_of_week, 1),
  weekly_report_hour = COALESCE(weekly_report_hour, 9)
WHERE key = 'alerts';

-- Adicionar comentários para as novas colunas
COMMENT ON COLUMN system_settings.weekly_report_enabled IS 'Habilita/desabilita envio automático de resumo semanal';
COMMENT ON COLUMN system_settings.weekly_report_day_of_week IS 'Dia da semana para envio: 0=Domingo, 1=Segunda, ..., 6=Sábado';
COMMENT ON COLUMN system_settings.weekly_report_hour IS 'Hora do dia para envio (0-23)';

-- Verificar resultado
SELECT 
  key,
  low_stock_threshold_days,
  weekly_report_enabled,
  weekly_report_day_of_week,
  weekly_report_hour,
  email_notifications_enabled,
  push_notifications_enabled,
  whatsapp_enabled
FROM system_settings 
WHERE key = 'alerts';
