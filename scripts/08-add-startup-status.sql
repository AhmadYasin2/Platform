-- Add status column to startups table for soft deletion
ALTER TABLE startups ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add marketplace_access column to startups table
ALTER TABLE startups ADD COLUMN marketplace_access BOOLEAN DEFAULT true;

-- Update existing startups to have active status and marketplace access
UPDATE startups SET status = 'active', marketplace_access = true WHERE status IS NULL;
