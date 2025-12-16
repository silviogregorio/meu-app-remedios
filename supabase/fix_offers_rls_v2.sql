
-- Enable RLS on tables if not already enabled
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_offers ENABLE ROW LEVEL SECURITY;

-- 1. SPONSORS Policies
-- Drop existing potential conflicting policies
DROP POLICY IF EXISTS "Public view active sponsors" ON sponsors;
DROP POLICY IF EXISTS "Authenticated view active sponsors" ON sponsors;
DROP POLICY IF EXISTS "Sponsors are viewable by everyone" ON sponsors;

-- Create a broad policy for EVERYONE (Anon + Authenticated) to see active sponsors
CREATE POLICY "Public view active sponsors"
ON sponsors FOR SELECT
TO public
USING ( active = true );

-- 2. AD_OFFERS Policies
DROP POLICY IF EXISTS "Public view active offers" ON ad_offers;
DROP POLICY IF EXISTS "Authenticated view active offers" ON ad_offers;
DROP POLICY IF EXISTS "Offers are viewable by everyone" ON ad_offers;

-- Create a broad policy for EVERYONE to see active offers
CREATE POLICY "Public view active offers"
ON ad_offers FOR SELECT
TO public
USING ( active = true );
