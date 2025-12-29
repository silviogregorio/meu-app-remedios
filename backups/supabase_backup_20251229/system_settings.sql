-- ====================================
-- TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ====================================
-- Permite configuração dinâmica de parâmetros do sistema via painel admin

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  
  -- Configurações de Alertas de Estoque
  low_stock_threshold_days INTEGER DEFAULT 4 CHECK (low_stock_threshold_days > 0 AND low_stock_threshold_days <= 30),
  
  -- Configurações de Resumo Semanal
  weekly_report_enabled BOOLEAN DEFAULT true,
  weekly_report_day_of_week INTEGER DEFAULT 1 CHECK (weekly_report_day_of_week >= 0 AND weekly_report_day_of_week <= 6),  -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  weekly_report_hour INTEGER DEFAULT 9 CHECK (weekly_report_hour >= 0 AND weekly_report_hour <= 23),  -- 0-23 horas
  
  -- Toggles de Notificações
  email_notifications_enabled BOOLEAN DEFAULT true,
  push_notifications_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  
  -- Metadados
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO system_settings (key, low_stock_threshold_days)
VALUES ('alerts', 4)
ON CONFLICT (key) DO NOTHING;

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins podem ler configurações
CREATE POLICY "Admins can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    auth.email() IN (
      'sigremedios@gmail.com', 
      'sigsis@gmail.com', 
      'silviogregorio@gmail.com'
    )
  );

-- Policy 2: Admins podem atualizar configurações
CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    auth.email() IN (
      'sigremedios@gmail.com', 
      'sigsis@gmail.com', 
      'silviogregorio@gmail.com'
    )
  )
  WITH CHECK (
    auth.email() IN (
      'sigremedios@gmail.com', 
      'sigsis@gmail.com', 
      'silviogregorio@gmail.com'
    )
  );

-- ====================================
-- TRIGGERS
-- ====================================

-- Trigger para atualizar timestamp e user ID automaticamente
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER system_settings_updated
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

-- ====================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ====================================
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema gerenciadas por administradores';
COMMENT ON COLUMN system_settings.low_stock_threshold_days IS 'Número de dias para disparar alerta de estoque baixo (1-30)';
COMMENT ON COLUMN system_settings.weekly_report_enabled IS 'Habilita/desabilita envio automático de resumo semanal';
COMMENT ON COLUMN system_settings.weekly_report_day_of_week IS 'Dia da semana para envio: 0=Domingo, 1=Segunda, ..., 6=Sábado';
COMMENT ON COLUMN system_settings.weekly_report_hour IS 'Hora do dia para envio (0-23)';
COMMENT ON COLUMN system_settings.email_notifications_enabled IS 'Habilita/desabilita notificações por email';
COMMENT ON COLUMN system_settings.push_notifications_enabled IS 'Habilita/desabilita notificações push';
COMMENT ON COLUMN system_settings.whatsapp_enabled IS 'Habilita/desabilita links de WhatsApp nas notificações';
