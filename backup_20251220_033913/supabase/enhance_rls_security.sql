
-- ENHANCE RLS SECURITY FOR OFFERS
-- Strict visibility rules: Active + Started + Not Expired

DROP POLICY IF EXISTS "Public view active offers" ON ad_offers;

CREATE POLICY "Public view active offers"
ON ad_offers FOR SELECT
TO public
USING (
  active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (expires_at IS NULL OR expires_at > NOW())
);

-- Ensure admins/sponsors can still see everything they own (Managed by existing "Authenticated" policy? Check it.)
-- If not exists, ensure we have one for management:

DROP POLICY IF EXISTS "Sponsors manage their own offers" ON ad_offers;

CREATE POLICY "Sponsors manage their own offers"
ON ad_offers FOR ALL
TO authenticated
USING (
  sponsor_id IN (
    SELECT id FROM sponsors WHERE user_id = auth.uid()
  )
);
