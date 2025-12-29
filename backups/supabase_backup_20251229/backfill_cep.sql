-- Backfill existing profiles with default location (Fernandópolis/SP)
-- CEP: 15610-378
-- IBGE: 3515509

UPDATE public.profiles
SET 
  cep = '15610-378',
  city = 'Fernandópolis',
  state = 'SP',
  ibge_code = '3515509'
WHERE 
  cep IS NULL OR cep = '';

-- Optional: Verify the update
-- SELECT count(*) as updated_users FROM public.profiles WHERE ibge_code = '3515509';
