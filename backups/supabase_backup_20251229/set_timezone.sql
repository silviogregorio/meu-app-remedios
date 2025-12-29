-- Set Database Timezone to Brasilia (UTC-3)
-- This ensures that CURRENT_TIMESTAMP, NOW(), etc., return local time
-- and can help with date logic consistency.

ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Validate settings
SELECT current_setting('TIMEZONE');
