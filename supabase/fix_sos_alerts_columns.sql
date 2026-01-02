-- Fix: Add missing columns to sos_alerts table
-- Run this in Supabase SQL Editor

-- Add alert_type column (emergency or help_request)
ALTER TABLE sos_alerts 
ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'emergency';

-- Add address column for reverse geocoded location
ALTER TABLE sos_alerts 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add accuracy column for GPS accuracy in meters
ALTER TABLE sos_alerts 
ADD COLUMN IF NOT EXISTS accuracy NUMERIC;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'sos_alerts'
ORDER BY ordinal_position;
