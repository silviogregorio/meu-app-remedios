-- Table to store FCM tokens for push notifications
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info TEXT, -- Optional: "Chrome on Windows", "iPhone", etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- RLS Policies
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own tokens
CREATE POLICY "Users can manage their own FCM tokens"
    ON public.fcm_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for lookup
CREATE INDEX IF NOT EXISTS fcm_tokens_user_id_idx ON public.fcm_tokens(user_id);
