-- Add observations column to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS observations text;

COMMENT ON COLUMN public.medications.observations IS 'Observações gerais sobre o medicamento (ex: uso sublingual, modo de conservação)';
