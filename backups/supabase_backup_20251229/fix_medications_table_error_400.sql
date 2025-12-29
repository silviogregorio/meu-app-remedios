-- SCRIPT DE CORREÇÃO UNIFICADA: TABELA MEDICATIONS
-- Objetivo: Resolver o Erro 400 ao adicionar medicamentos

-- 1. Alterar a coluna 'quantity' de integer para decimal (numeric)
-- Isso permite o cadastro de xaropes, gotas e volumes fracionados.
ALTER TABLE public.medications 
ALTER COLUMN quantity TYPE numeric USING quantity::numeric;

-- 2. Garantir que a coluna 'unit_quantity' exista
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS unit_quantity integer;

-- 3. Garantir que a coluna 'observations' exista
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS observations text;

-- 4. Garantir que as colunas visuais existam (caso não tenham sido criadas)
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS shape text DEFAULT 'round',
ADD COLUMN IF NOT EXISTS color text DEFAULT 'white';

-- 5. Atualizar comentários para clareza
COMMENT ON COLUMN public.medications.quantity IS 'Estoque atual (aceita decimais para xaropes/gotas)';
COMMENT ON COLUMN public.medications.unit_quantity IS 'Quantidade total na caixa (ex: 20 comprimidos)';
