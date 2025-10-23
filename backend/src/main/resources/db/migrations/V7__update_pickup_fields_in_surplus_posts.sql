-- Step 1: Add the new columns individually
ALTER TABLE surplus_posts ADD COLUMN pickup_date DATE;
ALTER TABLE surplus_posts ADD COLUMN pickup_from_time TIME;
ALTER TABLE surplus_posts ADD COLUMN pickup_to_time TIME;

-- Step 2: Copy existing data
UPDATE surplus_posts
SET
    pickup_date = CAST(pickup_from AS DATE),
    pickup_from_time = CAST(pickup_from AS TIME),
    pickup_to_time = CAST(pickup_to AS TIME);

-- Step 3: Drop old columns individually
ALTER TABLE surplus_posts DROP COLUMN pickup_from;
ALTER TABLE surplus_posts DROP COLUMN pickup_to;

-- Step 4: Rename new columns to match entity
ALTER TABLE surplus_posts RENAME COLUMN pickup_from_time TO pickup_from;
ALTER TABLE surplus_posts RENAME COLUMN pickup_to_time TO pickup_to;
