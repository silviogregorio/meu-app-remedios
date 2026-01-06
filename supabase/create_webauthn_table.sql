-- Create table for WebAuthn credentials
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    friendly_name TEXT,
    counter BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage their own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can manage their own credentials"
    ON public.webauthn_credentials
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service Role Policy (for Edge Functions)
DROP POLICY IF EXISTS "Service role can manage all credentials" ON public.webauthn_credentials;
CREATE POLICY "Service role can manage all credentials"
    ON public.webauthn_credentials
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- index for performance
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON public.webauthn_credentials(user_id);
