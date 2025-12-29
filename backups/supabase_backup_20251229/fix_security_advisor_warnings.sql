-- =====================================================
-- FIX SUPABASE SECURITY ADVISOR WARNINGS
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: First, let's find the correct function signatures
-- Run this query first to see all function signatures:

SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments,
    CASE WHEN p.proconfig IS NULL THEN 'NO search_path set' ELSE array_to_string(p.proconfig, ', ') END AS current_config
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname IN (
    'update_system_settings_timestamp',
    'get_missed_doses',
    'check_access',
    'increment_offer_clicks',
    'increment_offer_views',
    'is_admin',
    'get_tokens_by_emails',
    'can_manage_patient_data',
    'has_full_access'
)
ORDER BY p.proname;

-- =====================================================
-- STEP 2: Based on what you see above, run these fixes
-- (uncomment and adjust signatures as needed)
-- =====================================================

-- Fix update_system_settings_timestamp (likely no args)
ALTER FUNCTION public.update_system_settings_timestamp() SET search_path = '';

-- Fix check_access (likely takes uuid)  
ALTER FUNCTION public.check_access(uuid) SET search_path = '';

-- Fix increment_offer_clicks (likely takes uuid)
ALTER FUNCTION public.increment_offer_clicks(uuid) SET search_path = '';

-- Fix increment_offer_views (likely takes uuid)
ALTER FUNCTION public.increment_offer_views(uuid) SET search_path = '';

-- Fix is_admin (likely no args)
ALTER FUNCTION public.is_admin() SET search_path = '';

-- Fix get_tokens_by_emails (likely takes text[])
ALTER FUNCTION public.get_tokens_by_emails(text[]) SET search_path = '';

-- Fix can_manage_patient_data (likely takes uuid)
ALTER FUNCTION public.can_manage_patient_data(uuid) SET search_path = '';

-- Fix has_full_access if it exists (likely takes uuid)
ALTER FUNCTION public.has_full_access(uuid) SET search_path = '';

-- =====================================================
-- NOTE: get_missed_doses might not exist or have different name
-- Run the query in STEP 1 first to see what actually exists
-- =====================================================
