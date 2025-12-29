-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sponsors;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.sponsors;
DROP POLICY IF EXISTS "Allow admins full access" ON public.sponsors;

-- Enable RLS (just in case)
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (Active only)
CREATE POLICY "Public Read Active Sponsors"
ON public.sponsors
FOR SELECT
TO public
USING (active = true);

-- 2. Admin Full Access (Select, Insert, Update, Delete)
-- We use a simpler boolean check implementation for the USING clause to avoid ambiguity
CREATE POLICY "Admin Full Access"
ON public.sponsors
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'sigsis@gmail.com', 
    'silviogregorio@gmail.com', 
    'sigremedios@gmail.com'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'sigsis@gmail.com', 
    'silviogregorio@gmail.com', 
    'sigremedios@gmail.com'
  )
);
