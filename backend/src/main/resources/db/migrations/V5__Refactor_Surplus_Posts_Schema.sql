-- Drop old indexes that reference columns we're removing
DROP INDEX IF EXISTS idx_surplus_posts_food_type;
DROP INDEX IF EXISTS idx_surplus_posts_pickup_from;

-- Add new columns (allow NULL initially for safe migration)
ALTER TABLE surplus_posts ADD COLUMN title VARCHAR(255);
ALTER TABLE surplus_posts ADD COLUMN description TEXT;
ALTER TABLE surplus_posts ADD COLUMN status VARCHAR(50);
ALTER TABLE surplus_posts ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE surplus_posts ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE surplus_posts ADD COLUMN address VARCHAR(255);
ALTER TABLE surplus_posts ADD COLUMN quantity_value DOUBLE PRECISION;

-- Rename unit column to match embedded Quantity object
-- (Keep unit column as it's part of the embedded Quantity)

-- Change pickup_to from TIME to TIMESTAMP
ALTER TABLE surplus_posts 
    ALTER COLUMN pickup_to TYPE TIMESTAMP 
    USING (pickup_from::DATE + pickup_to);

-- Migrate existing data to new structure
UPDATE surplus_posts SET 
    title = COALESCE(food_name, 'Untitled Food Item'),
    description = COALESCE(notes, 'No description provided'),
    status = 'AVAILABLE',
    latitude = 0.0,
    longitude = 0.0,
    address = location,
    quantity_value = CAST(quantity AS DOUBLE PRECISION)
WHERE title IS NULL;

-- Set NOT NULL constraints on new required columns
ALTER TABLE surplus_posts ALTER COLUMN title SET NOT NULL;
ALTER TABLE surplus_posts ALTER COLUMN description SET NOT NULL;
ALTER TABLE surplus_posts ALTER COLUMN status SET NOT NULL;
ALTER TABLE surplus_posts ALTER COLUMN quantity_value SET NOT NULL;

-- Drop old columns that are no longer used
ALTER TABLE surplus_posts DROP COLUMN food_name;
ALTER TABLE surplus_posts DROP COLUMN food_type;
ALTER TABLE surplus_posts DROP COLUMN location;
ALTER TABLE surplus_posts DROP COLUMN notes;
ALTER TABLE surplus_posts DROP COLUMN quantity;

-- Create the food categories junction table
CREATE TABLE surplus_post_food_types (
    surplus_post_id BIGINT NOT NULL,
    food_category VARCHAR(100) NOT NULL,
    FOREIGN KEY (surplus_post_id) REFERENCES surplus_posts(id) ON DELETE CASCADE
);

-- Create indexes for the new structure
CREATE INDEX idx_surplus_posts_status ON surplus_posts(status);
CREATE INDEX idx_surplus_posts_expiry_date_status ON surplus_posts(expiry_date, status);
CREATE INDEX idx_surplus_posts_title ON surplus_posts(title);
CREATE INDEX idx_surplus_post_food_types_post_id ON surplus_post_food_types(surplus_post_id);
CREATE INDEX idx_surplus_post_food_types_category ON surplus_post_food_types(food_category);