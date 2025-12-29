-- Fix health_tips RLS to allow public (non-authenticated) access
-- This is needed for the Landing Page "Dica do Dia" section

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Allow authenticated read health_tips" ON public.health_tips;
DROP POLICY IF EXISTS "Allow public read health_tips" ON public.health_tips;

-- Create a new policy that allows everyone to read health tips
CREATE POLICY "Allow public read health_tips" 
ON public.health_tips FOR SELECT 
TO anon, authenticated 
USING (true);

-- Verify
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'health_tips';
