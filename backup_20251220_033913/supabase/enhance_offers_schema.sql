
-- Enhance ad_offers table with scheduling and active control

-- 1. Add starts_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_offers' AND column_name = 'starts_at') THEN
        ALTER TABLE public.ad_offers ADD COLUMN starts_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Ensure expires_at exists (it should, but safety first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_offers' AND column_name = 'expires_at') THEN
        ALTER TABLE public.ad_offers ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Ensure active column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_offers' AND column_name = 'active') THEN
        ALTER TABLE public.ad_offers ADD COLUMN active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 4. Update RLS Policies

-- Enable RLS
ALTER TABLE public.ad_offers ENABLE ROW LEVEL SECURITY;

-- Policy for Public Read: Active offers only, within time range
DROP POLICY IF EXISTS "Public can view active offers" ON public.ad_offers;
CREATE POLICY "Public can view active offers" ON public.ad_offers
    FOR SELECT
    USING (
        active = true 
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Policy for Admin/Authenticated Write: Full access
-- Assuming authenticated users are admins/sponsors for this app context.
DROP POLICY IF EXISTS "Authenticated users can manage offers" ON public.ad_offers;
CREATE POLICY "Authenticated users can manage offers" ON public.ad_offers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
