-- Add emergency_contact_email to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS emergency_contact_email text;
