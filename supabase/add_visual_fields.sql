-- Add visual fields to medications table for "Pill Avatar" feature
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'white', -- hex code or name (e.g. 'bg-blue-500' if using tailwind classes, but hex is better for custom SVGs)
ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'round'; -- 'round', 'capsule', 'oval', 'liquid'

-- Ensure default values for existing rows
UPDATE medications SET color = 'white', shape = 'round' WHERE color IS NULL;
