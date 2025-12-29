-- Add address column to sos_alerts to avoid reverse geocoding issues
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN sos_alerts.address IS 'Optional textual address passed from frontend to avoid reverse geocoding errors';
