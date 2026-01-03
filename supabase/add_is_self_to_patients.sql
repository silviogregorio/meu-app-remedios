-- Add is_self column to patients table to identify auto-created profiles
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_self boolean DEFAULT false;

-- Add emergency contact fields if they don't already exist (ensuring robustness)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS emergency_contact_email text;
