-- Robust fix for Missing Specialty Relationship
DO $$
BEGIN
    -- 1. Ensure the column exists. If not, add it.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_appointments' AND column_name = 'specialty_id') THEN
        ALTER TABLE public.medical_appointments ADD COLUMN specialty_id UUID;
    END IF;

    -- 2. Drop the constraint if it exists to avoid conflicts
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_appointments_specialty_id_fkey') THEN
        ALTER TABLE public.medical_appointments DROP CONSTRAINT medical_appointments_specialty_id_fkey;
    END IF;

    -- 3. Add the foreign key constraint
    ALTER TABLE public.medical_appointments
    ADD CONSTRAINT medical_appointments_specialty_id_fkey
    FOREIGN KEY (specialty_id)
    REFERENCES public.medical_specialties(id)
    ON DELETE SET NULL;
END $$;

-- Force a schema cache reload for PostgREST
NOTIFY pgrst, 'reload schema';
