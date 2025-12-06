-- ROBUST REALTIME FIX
-- Run this in Supabase SQL Editor.
-- It attempts to add each table to Realtime. If it's already there, it skips it silently.

DO $$
BEGIN
    -- Patients
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE patients;
    EXCEPTION WHEN duplicate_object THEN NULL; -- Ignore if already exists
    END;

    -- Medications
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE medications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Prescriptions
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Consumption Log
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE consumption_log;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Patient Shares
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE patient_shares;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

     -- Account Shares
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE account_shares;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

SELECT 'Realtime configuration checked and updated for all tables.' as status;
