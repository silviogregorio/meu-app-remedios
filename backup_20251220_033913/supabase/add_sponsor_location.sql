-- Add location columns to sponsors table
-- Purpose: Enable linking sponsors to specific cities (IBGE)

ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS ibge_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- Index for faster lookup by location
CREATE INDEX IF NOT EXISTS idx_sponsors_ibge_code ON public.sponsors(ibge_code);

-- Optional: If we wanted to enforce 1 sponsor per city (Old model), we would add a UNIQUE constraint.
-- But since we chose "Rotative/Marketplace", we DO NOT add unique constraint on ibge_code.
