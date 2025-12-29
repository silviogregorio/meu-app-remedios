-- Inspect RLS policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check if RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';

-- Check column permissions (grants)
SELECT grantee, privilege_type, is_grantable 
FROM information_schema.role_column_grants 
WHERE table_name = 'profiles' AND column_name = 'cep';
