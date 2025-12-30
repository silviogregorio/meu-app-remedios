-- Migration: Add missing columns to medical_appointments table
-- This script ensures the table has all fields required by the UI/Service and fixes the PGRST204 error.

DO $$
BEGIN
    -- Check for location_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_appointments' AND column_name = 'location_name') THEN
        ALTER TABLE public.medical_appointments ADD COLUMN location_name TEXT;
    END IF;

    -- Check for address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_appointments' AND column_name = 'address') THEN
        ALTER TABLE public.medical_appointments ADD COLUMN address TEXT;
    END IF;

    -- Check for contact_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_appointments' AND column_name = 'contact_phone') THEN
        ALTER TABLE public.medical_appointments ADD COLUMN contact_phone TEXT;
    END IF;

    -- Check for whatsapp_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_appointments' AND column_name = 'whatsapp_phone') THEN
        ALTER TABLE public.medical_appointments ADD COLUMN whatsapp_phone TEXT;
    END IF;

    -- Also check for specialty_text which is used when specialty_id is null
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_appointments' AND column_name = 'specialty_text') THEN
        ALTER TABLE public.medical_appointments ADD COLUMN specialty_text TEXT;
    END IF;
END $$;

-- Update the schema cache (optional but recommended in some environments)
NOTIFY pgrst, 'reload schema';
