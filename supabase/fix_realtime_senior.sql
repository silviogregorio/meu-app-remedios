-- SENIOR FIX FOR REALTIME UPDATES

-- 1. Ensure the table allows replication of all columns (critical for UPDATE payloads)
ALTER TABLE public.sponsors REPLICA IDENTITY FULL;

-- 2. Force add table to the realtime publication
-- (Using "ADD TABLE" can fail if already there, so we wrap or just set)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsors;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Reset Permissions for Public/Anon
GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT ON public.sponsors TO authenticated;
GRANT SELECT ON public.sponsors TO service_role;

-- 4. Clean up mess of policies and standardise on ONE single active policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sponsors;
DROP POLICY IF EXISTS "Public Read Active Sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Public can view active sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Public can view all sponsors" ON public.sponsors;

-- Create the ONE source of truth policy
-- NOTE: We use (true) to ensure ALL events (even setting active=false) are sent to the client.
-- Code logic handles filtering. This is safer for Realtime reliability.
CREATE POLICY "Public Realtime Access"
ON public.sponsors
FOR SELECT
TO public
USING (true);

-- 5. Notify Reload
NOTIFY pgrst, 'reload config';
