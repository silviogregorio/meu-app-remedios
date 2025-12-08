-- Add email column to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS email text;

-- Comment on column
COMMENT ON COLUMN public.patients.email IS 'Email address of the patient for notifications and contact.';
