-- CONSOLIDATED FIXES: RLS Policies & Tracking Functions
-- CORRECTED VERSION: Uses Email Whitelist for Admins (since sponsors table has no user_id)

-- 1. FIX TRACKING RPC FUNCTIONS
-- Re-create RPC functions to ensure they exist and work correctly
CREATE OR REPLACE FUNCTION increment_offer_clicks(offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_offers
  SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_offer_views(offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_offers
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = offer_id;
END;
$$;

-- 2. FIX RLS POLICIES FOR DELETION
-- Ensure strict visibility rules for PUBLIC: Active + Started + Not Expired
ALTER TABLE public.ad_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view active offers" ON ad_offers;

CREATE POLICY "Public view active offers"
ON ad_offers FOR SELECT
TO public
USING (
  active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (expires_at IS NULL OR expires_at > NOW())
);

-- Ensure ADMINS can manage (create, update, DELETE) ALL offers
DROP POLICY IF EXISTS "Sponsors manage their own offers" ON ad_offers;
DROP POLICY IF EXISTS "Admins manage offers" ON ad_offers;

CREATE POLICY "Admins manage offers"
ON ad_offers FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('sigsis@gmail.com', 'silviogregorio@gmail.com', 'sigremedios@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('sigsis@gmail.com', 'silviogregorio@gmail.com', 'sigremedios@gmail.com')
);
