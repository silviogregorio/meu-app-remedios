-- Migration: Add acknowledgment tracking to SOS alerts
-- Add resolved_at and acknowledged_by columns to sos_alerts

ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id);

-- Enable Realtime for the table again just in case
ALTER TABLE sos_alerts REPLICA IDENTITY FULL;
