-- ==========================================
-- Security Hardening Script - SiG Remédios (Idempotent)
-- ==========================================

-- 1. Centralized Admin Check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN (
      'sigremedios@gmail.com',
      'sigsis@gmail.com',
      'silviogregorio@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. System Settings Hardening
DROP POLICY IF EXISTS "Admins can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins manage system settings" ON system_settings;

CREATE POLICY "Admins manage system settings"
ON system_settings
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Sponsors Table Hardening
DROP POLICY IF EXISTS "Admin can do everything" ON sponsors;
DROP POLICY IF EXISTS "Public can view all sponsors" ON sponsors;
DROP POLICY IF EXISTS "Authenticated users view sponsors" ON sponsors;
DROP POLICY IF EXISTS "Admins manage sponsors" ON sponsors;

CREATE POLICY "Authenticated users view sponsors"
ON sponsors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage sponsors"
ON sponsors
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Medication Library Hardening
DROP POLICY IF EXISTS "Public Read Access" ON medication_library;
DROP POLICY IF EXISTS "Authenticated users read medication library" ON medication_library;
DROP POLICY IF EXISTS "Admins manage medication library" ON medication_library;

CREATE POLICY "Authenticated users read medication library"
ON medication_library FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage medication library"
ON medication_library
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Storage Security (Sponsors Bucket)
DROP POLICY IF EXISTS "Admin can upload sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete sponsor logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage sponsor logos" ON storage.objects;

CREATE POLICY "Admins manage sponsor logos"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'sponsors' AND public.is_admin())
WITH CHECK (bucket_id = 'sponsors' AND public.is_admin());

-- 6. Motivation Messages Hardening
DROP POLICY IF EXISTS "Anyone can read active messages" ON motivation_messages;
DROP POLICY IF EXISTS "Authenticated users read active motivation messages" ON motivation_messages;
DROP POLICY IF EXISTS "Admins manage motivation messages" ON motivation_messages;

CREATE POLICY "Authenticated users read active motivation messages"
ON motivation_messages FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins manage motivation messages"
ON motivation_messages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
