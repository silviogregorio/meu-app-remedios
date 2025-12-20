-- Add unit_quantity and observations columns to medications table
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS observations text,
ADD COLUMN IF NOT EXISTS unit_quantity integer;

COMMENT ON COLUMN public.medications.observations IS 'Observações gerais sobre o medicamento (ex: uso sublingual, modo de conservação)';
COMMENT ON COLUMN public.medications.unit_quantity IS 'Quantidade total de itens na caixa/unidade (ex: 20 comprimidos, 30 cápsulas)';
