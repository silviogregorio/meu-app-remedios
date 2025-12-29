-- Add location columns to profiles table
-- Purpose: Enable "Exclusive Pharmacy per City" business model by tracking user location via CEP and IBGE.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS ibge_code TEXT;

-- Create an index on ibge_code for faster sponsor matching later
CREATE INDEX IF NOT EXISTS idx_profiles_ibge_code ON public.profiles(ibge_code);

-- Update RLS policies if necessary (Owners can update their own profile)
-- The existing policy "Users can update own profile" should cover this if it allows ALL columns, 
-- but explicitly ensuring checking via separate audit if needed.
-- For now, standard RLS usually covers "UPDATE profile WHERE id = auth.uid()".
