-- Fix Prescription Table Structure (Add Missing Columns)

-- 1. Add 'dose_amount' if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'dose_amount') THEN
        ALTER TABLE prescriptions ADD COLUMN dose_amount TEXT;
    ELSE
        -- If it exists, ensure it is text to be safe
        ALTER TABLE prescriptions ALTER COLUMN dose_amount TYPE TEXT;
    END IF;
END $$;

-- 2. Add 'times' if missing, or ensure it is JSONB
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'times') THEN
        ALTER TABLE prescriptions ADD COLUMN times JSONB DEFAULT '[]'::jsonb;
    ELSE
        -- If exists, try to convert to JSONB
        BEGIN
            ALTER TABLE prescriptions ALTER COLUMN times TYPE JSONB USING times::jsonb;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not convert times to JSONB';
        END;
    END IF;
END $$;

-- 3. Ensure other columns exist (frequency, instructions)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'instructions') THEN
        ALTER TABLE prescriptions ADD COLUMN instructions TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'frequency') THEN
        ALTER TABLE prescriptions ADD COLUMN frequency TEXT;
    END IF;
END $$;
