-- SECURITY AUDIT AND HARDENING SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable Row Level Security (RLS) on ALL tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_shares ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all permissions from 'anon' and 'public' roles for sensitive operations
-- 'anon' should NOT be able to insert/update/delete sensitive data directly
REVOKE INSERT, UPDATE, DELETE ON public.patients FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.medications FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.prescriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.consumption_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.account_shares FROM anon;

-- Note: We often leave SELECT granted to anon if we use strict RLS policies to filter rows.
-- However, for maximum security, if your app is behind auth, you can revoke SELECT too
-- and only grant it to 'authenticated', but Supabase client client requires some permissions.
-- Safe default: allow usage but restrict via RLS (already enabled above).

-- 3. Audit Policies (Manual Check logic)
-- Ensure no policy exists that uses 'true' for 'USING' clause on sensitive tables.
-- The following are correct, strict patterns:
-- USING (auth.uid() = user_id)
-- USING (public.check_access(user_id))

-- 4. Function Security using SECURITY DEFINER
-- Ensure helper functions run with necessary privileges but are secure.
-- We already defined 'check_access' properly. Just ensuring it's set.
ALTER FUNCTION public.check_access(uuid) SECURITY DEFINER;
-- Grant execute only to authenticated users
REVOKE EXECUTE ON FUNCTION public.check_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.check_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_access(uuid) TO service_role;

-- 5. Rate Limiting (Note: This is usually done at the API Gateway/Kong level in Supabase, 
-- but we can't configure it via SQL. This is a reminder to enable it in Project Settings).

-- 6. Verify no clear text passwords (sanity check, usually handled by Auth)
-- No action needed for supabase auth.users.

-- 7. Ensure `account_shares` policies are tight
-- Only owner can insert/delete shares.
CREATE POLICY "Users can manage their own shares"
ON public.account_shares
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Prevent users from seeing other people's sharing lists (already covered by above policy if exists)

SELECT 'Security hardening applied. RLS enabled, permissions revoked from anon.' as result;
