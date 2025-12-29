-- Add temperature_category and packaging_type columns to surplus_posts table for food safety compliance

-- Add temperature_category column
ALTER TABLE surplus_posts
ADD COLUMN temperature_category VARCHAR(50);

-- Add packaging_type column
ALTER TABLE surplus_posts
ADD COLUMN packaging_type VARCHAR(50);

-- Add check constraints to ensure only valid enum values are stored
ALTER TABLE surplus_posts
ADD CONSTRAINT chk_temperature_category
CHECK (temperature_category IN ('FROZEN', 'REFRIGERATED', 'ROOM_TEMPERATURE', 'HOT_COOKED'));

ALTER TABLE surplus_posts
ADD CONSTRAINT chk_packaging_type
CHECK (packaging_type IN ('SEALED', 'LOOSE', 'REFRIGERATED_CONTAINER', 'FROZEN_CONTAINER', 'VACUUM_PACKED', 'BOXED', 'WRAPPED', 'BULK', 'OTHER'));

-- Create indexes for filtering and analytics
CREATE INDEX idx_surplus_posts_temperature_category ON surplus_posts(temperature_category);
CREATE INDEX idx_surplus_posts_packaging_type ON surplus_posts(packaging_type);

-- Update existing posts with default values for backward compatibility
UPDATE surplus_posts
SET temperature_category = 'ROOM_TEMPERATURE',
    packaging_type = 'OTHER'
WHERE temperature_category IS NULL;

-- Note: We're not setting NOT NULL constraints to allow flexibility for legacy data
-- and partial updates. Validation is handled at the application layer.

