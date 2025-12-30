-- Add fabrication_date column to surplus_posts table
-- This field stores the production/manufacturing date of the food item
-- Used to automatically calculate expiry dates based on food category rules

ALTER TABLE surplus_posts
    ADD COLUMN fabrication_date DATE;

-- Add index for querying by fabrication date
CREATE INDEX idx_surplus_posts_fabrication_date ON surplus_posts(fabrication_date);

-- Add comment explaining the field
COMMENT ON COLUMN surplus_posts.fabrication_date IS 'Date when the food was produced/manufactured. Used for automatic expiry calculation.';

