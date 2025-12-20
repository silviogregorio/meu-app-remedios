-- Adiciona suporte a precisão de geolocalização na tabela de SOS
ALTER TABLE sos_alerts 
ADD COLUMN IF NOT EXISTS accuracy double precision;

COMMENT ON COLUMN sos_alerts.accuracy IS 'Precisão da geolocalização em metros';
