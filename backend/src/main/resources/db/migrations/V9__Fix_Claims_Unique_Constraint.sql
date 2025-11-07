-- Drop the old constraint
ALTER TABLE claims DROP CONSTRAINT IF EXISTS unique_active_claim;

-- Add the correct partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_claim_idx 
ON claims(surplus_post_id) 
WHERE status = 'ACTIVE';
