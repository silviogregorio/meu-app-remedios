-- Migration: Fix Realtime Sharing Config
-- Contains: Column check, Lowercase Trigger, Replica Identity, Publication, and RLS

-- 1. Add column shared_with_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patient_shares' AND column_name = 'shared_with_id') THEN
        ALTER TABLE patient_shares ADD COLUMN shared_with_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Lowercase Trigger
CREATE OR REPLACE FUNCTION public.lowercase_share_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.shared_with_email = LOWER(NEW.shared_with_email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_lowercase_email ON public.patient_shares;
CREATE TRIGGER ensure_lowercase_email
    BEFORE INSERT OR UPDATE ON public.patient_shares
    FOR EACH ROW
    EXECUTE FUNCTION public.lowercase_share_email();
    
-- Retroactive Fix
UPDATE patient_shares SET shared_with_email = LOWER(shared_with_email);

-- 3. Replica Identity (Critical for DELETE events)
ALTER TABLE patient_shares REPLICA IDENTITY FULL;

-- 4. Publication (Critical for Broadcasting)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    patients, 
    medications, 
    prescriptions, 
    consumption_log, 
    patient_shares;

-- 5. RLS Policies
ALTER TABLE patient_shares ENABLE ROW LEVEL SECURITY;

-- Owner Access
DROP POLICY IF EXISTS "Owner access" ON patient_shares;
CREATE POLICY "Owner access" ON patient_shares FOR ALL
    USING (owner_id = auth.uid());

-- Invitee Access (Critical for receiving Realtime events)
DROP POLICY IF EXISTS "Ver meus compartilhamentos (Recebidos)" ON patient_shares;
CREATE POLICY "Ver meus compartilhamentos (Recebidos)"
    ON patient_shares FOR SELECT
    USING (
        shared_with_email = (auth.jwt() ->> 'email')
    );

GRANT ALL ON patient_shares TO authenticated;
GRANT ALL ON patient_shares TO service_role;
