-- Add visual identity columns to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS shape text DEFAULT 'round',
ADD COLUMN IF NOT EXISTS color text DEFAULT 'white';

-- Force a refresh of the schema cache if needed (comment only)
COMMENT ON COLUMN public.medications.shape IS 'Visual shape of the pill (round, capsule, oval, etc)';
COMMENT ON COLUMN public.medications.color IS 'Visual color of the pill';
