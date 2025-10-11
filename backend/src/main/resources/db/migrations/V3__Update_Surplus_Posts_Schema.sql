-- Add new columns (allow NULL initially)
ALTER TABLE surplus_posts ADD COLUMN food_name VARCHAR(255);
ALTER TABLE surplus_posts ADD COLUMN unit VARCHAR(50);
ALTER TABLE surplus_posts ADD COLUMN pickup_to TIME;
ALTER TABLE surplus_posts ADD COLUMN notes TEXT;

-- Rename columns
ALTER TABLE surplus_posts RENAME COLUMN type TO food_type;
ALTER TABLE surplus_posts RENAME COLUMN pickup_time TO pickup_from;

-- Change quantity type
ALTER TABLE surplus_posts 
    ALTER COLUMN quantity TYPE DOUBLE PRECISION 
    USING quantity::DOUBLE PRECISION;

-- ✅ UPDATE EXISTING ROWS FIRST (before setting NOT NULL!)
UPDATE surplus_posts SET 
    food_name = 'Legacy Food Item' 
WHERE food_name IS NULL;

UPDATE surplus_posts SET 
    unit = 'kg' 
WHERE unit IS NULL;

UPDATE surplus_posts SET 
    pickup_to = '18:00:00' 
WHERE pickup_to IS NULL;

UPDATE surplus_posts SET 
    notes = 'No description provided' 
WHERE notes IS NULL;

-- ✅ NOW set NOT NULL (after UPDATE)
ALTER TABLE surplus_posts ALTER COLUMN food_name SET NOT NULL;
ALTER TABLE surplus_posts ALTER COLUMN unit SET NOT NULL;
ALTER TABLE surplus_posts ALTER COLUMN pickup_to SET NOT NULL;
ALTER TABLE surplus_posts ALTER COLUMN notes SET NOT NULL;

-- Add indexes
CREATE INDEX idx_surplus_posts_food_type ON surplus_posts(food_type);
CREATE INDEX idx_surplus_posts_pickup_from ON surplus_posts(pickup_from);
