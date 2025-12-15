-- SECURITY HARDENING & BUG FIX SCRIPT
-- This script addresses "Hacker Mode" findings:
-- 1. Secures "Security Definer" functions against Search Path Hijacking.
-- 2. Optimizes RLS policies to avoid slow/risky auth.users joins.
-- 3. Revokes usage on internal functions from public.

-- ==============================================================================
-- 1. SECURE HELPER FUNCTIONS (Search Path Hijacking Fix)
-- ==============================================================================

-- Fix `has_full_access` if it exists
CREATE OR REPLACE FUNCTION public.has_full_access(resource_owner_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        -- Owner
        resource_owner_id = auth.uid()
        OR
        -- Shared
        EXISTS (
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            -- Use JWT claim instead of selecting from auth.users (Security + Perf)
            AND shared_with_email = (auth.jwt() ->> 'email')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix `check_access` if it exists (Standardizing on one or the other)
CREATE OR REPLACE FUNCTION public.check_access(resource_owner_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        auth.uid() = resource_owner_id
        OR
        EXISTS (
            SELECT 1 FROM public.account_shares
            WHERE owner_id = resource_owner_id
            AND shared_with_email = (auth.jwt() ->> 'email')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remove public execute permissions
REVOKE EXECUTE ON FUNCTION public.has_full_access(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_access(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.has_full_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_access(uuid) TO authenticated, service_role;


-- ==============================================================================
-- 2. OPTIMIZE RLS POLICIES (Remove implicit auth.users dependency)
-- ==============================================================================

-- Account Shares: Use JWT for email check
DROP POLICY IF EXISTS "Usuários veem compartilhamentos recebidos" ON public.account_shares;
CREATE POLICY "Usuários veem compartilhamentos recebidos"
    ON public.account_shares
    FOR SELECT
    USING (shared_with_email = (auth.jwt() ->> 'email'));

-- ==============================================================================
-- 3. REVOKE SENSITIVE PERMISSIONS
-- ==============================================================================
REVOKE INSERT, UPDATE, DELETE ON public.account_shares FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.patients FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.medications FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.prescriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.consumption_log FROM anon;

