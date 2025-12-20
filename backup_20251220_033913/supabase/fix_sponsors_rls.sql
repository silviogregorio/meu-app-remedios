-- Enable RLS on sponsors table if not already enabled
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Allow everyone (anon and authenticated) to read ACTIVE sponsors
CREATE POLICY "Enable read access for all users" ON "public"."sponsors"
AS PERMISSIVE FOR SELECT
TO public
USING (active = true);

-- Allow admins to do everything (already likely handles via dashboard, but ensuring via SQL)
-- Assuming admin logic is handled via app level or another policy, but let's ensure:
-- (This policy depends on your auth logic, usually checking email or claim)
-- straightforward Policy for now:
CREATE POLICY "Enable all access for admins" ON "public"."sponsors"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' IN ('sigsis@gmail.com', 'silviogregorio@gmail.com', 'sigremedios@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('sigsis@gmail.com', 'silviogregorio@gmail.com', 'sigremedios@gmail.com'));
