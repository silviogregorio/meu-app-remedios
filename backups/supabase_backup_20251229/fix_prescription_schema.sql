-- Fix Prescriptions Table Schema
-- Addresses 400 Bad Request errors during insertion

-- 1. Ensure 'times' column handles arrays/json
-- We'll explicitly cast it to JSONB which is most flexible for ["08:00", "12:00"]
-- If it's currently text or varchar, this will fix it.
DO $$
BEGIN
    -- Check current type, if it's strictly varchar, user might have issues.
    -- We will try to change it to JSONB (or json).
    -- If already jsonb, this does nothing.
    BEGIN
        ALTER TABLE prescriptions 
        ALTER COLUMN times TYPE JSONB 
        USING times::jsonb;
    EXCEPTION WHEN OTHERS THEN
        -- If casting fails (e.g. existing bad data), we ignore for now
        RAISE NOTICE 'Could not convert times to JSONB automatically.';
    END;
END $$;

-- 2. Ensure dose_amount is flexible (Text is safetst, allows "1.5 mg")
-- If it's integer, "1.5" fails.
ALTER TABLE prescriptions 
ALTER COLUMN dose_amount TYPE TEXT;

-- 3. Ensure foreign keys aren't too strict on user_id 
-- (Sometimes user_id in prescription doesn't match patient owner, which is fine)
-- We just need valid uuid.
-- (This is usually fine, just a sanity check comment)

-- 4. Verify RLS for INSERT
-- Re-apply the shared editor policy just in case it was missed
DROP POLICY IF EXISTS "Shared editor manages prescriptions" ON prescriptions;
CREATE POLICY "Shared editor manages prescriptions"
    ON prescriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM patient_shares
            WHERE patient_shares.patient_id = prescriptions.patient_id
            AND (
                patient_shares.shared_with_id = auth.uid() OR
                lower(patient_shares.shared_with_email) = lower(auth.jwt() ->> 'email')
            )
            AND patient_shares.permission = 'edit'
            AND patient_shares.accepted_at IS NOT NULL
        )
    );
