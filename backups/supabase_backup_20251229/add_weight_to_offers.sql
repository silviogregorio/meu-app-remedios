
-- Add weight column to ad_offers if it doesn't exist
ALTER TABLE ad_offers 
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 0;

-- Optional: Update existing offers to have a default weight if needed, 
-- though DEFAULT 0 handles new ones.
UPDATE ad_offers SET weight = 0 WHERE weight IS NULL;
