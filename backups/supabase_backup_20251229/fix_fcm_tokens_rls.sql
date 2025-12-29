-- ==========================================
-- FIX FCM TOKENS RLS & SCHEMA
-- ==========================================

-- 1. Ensure columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fcm_tokens' AND column_name = 'last_seen') THEN
        ALTER TABLE public.fcm_tokens ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Ensure token is UNIQUE (One device = One record)
-- Drop composite unique if it exists to replace with simple unique on token
ALTER TABLE public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_token_key;
ALTER TABLE public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;
ALTER TABLE public.fcm_tokens ADD CONSTRAINT fcm_tokens_token_key UNIQUE (token);

-- 3. Fix RLS Policies
-- The error "new row violates row-level security policy" on upsert happens because 
-- RLS blocks the UPDATE of a row owned by another user (common during logout/login).

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own fcm tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can insert their own fcm token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can update their own fcm token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can select their own fcm token" ON public.fcm_tokens;

-- Strategy:
-- SELECT: Only own tokens
CREATE POLICY "Users can select own tokens" 
    ON public.fcm_tokens FOR SELECT 
    USING (auth.uid() = user_id);

-- INSERT: Only own tokens
CREATE POLICY "Users can insert own tokens" 
    ON public.fcm_tokens FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only own tokens
CREATE POLICY "Users can update own tokens" 
    ON public.fcm_tokens FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Only own tokens
CREATE POLICY "Users can delete own tokens" 
    ON public.fcm_tokens FOR DELETE 
    USING (auth.uid() = user_id);

-- SPECIAL: Allow anyone to DELETE a token if they have it (to allow "taking over" a device)
-- This is necessary so the frontend can "clear" a token if it belongs to someone else 
-- before re-inserting it for the new user, avoiding RLS blocking the upsert.
CREATE POLICY "Users can delete any token they possess"
    ON public.fcm_tokens FOR DELETE
    USING (true); -- We rely on the fact that 'token' is a secret only known by the device.

-- GRANT permissions
GRANT ALL ON public.fcm_tokens TO authenticated;
GRANT ALL ON public.fcm_tokens TO service_role;
