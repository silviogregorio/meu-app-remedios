-- Adicionar campos de SOS (Emergência)
-- 1. Tabela Pacientes
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS blood_type text,
ADD COLUMN IF NOT EXISTS allergies text;

-- 2. Tabela Prescrições
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS continuous_use boolean DEFAULT false;

-- Documentação (Opcional, mas boa prática)
COMMENT ON COLUMN patients.blood_type IS 'Tipo Sanguíneo (Ex: A+, O-)';
COMMENT ON COLUMN patients.allergies IS 'Lista de alergias e intolerâncias';
COMMENT ON COLUMN prescriptions.continuous_use IS 'Flag para medicamentos de uso contínuo (sem data fim obrigatória)';
