-- Adicionar coluna shared_with_id na tabela patient_shares se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_shares' AND column_name = 'shared_with_id') THEN
        ALTER TABLE public.patient_shares ADD COLUMN shared_with_id uuid REFERENCES auth.users(id);
    END IF;
END $$;
