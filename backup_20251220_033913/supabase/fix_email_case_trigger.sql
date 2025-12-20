-- Trigger to enforce lowercase emails in patient_shares
-- This is critical for matching Realtime filters (which are case-sensitive)
-- and for RLS policies (which compare against auth.email()).

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

-- Also fix existing data just in case
UPDATE patient_shares SET shared_with_email = LOWER(shared_with_email);
