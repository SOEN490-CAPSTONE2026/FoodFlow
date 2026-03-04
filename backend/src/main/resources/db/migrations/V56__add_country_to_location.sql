-- Add country column to surplus_posts table for location-based filtering
-- Country will store full country names (e.g., "Canada", "United States", "Mexico")
ALTER TABLE surplus_posts ADD COLUMN country VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN surplus_posts.country IS 'Full country name for pickup location (e.g., Canada, United States, Mexico). Used for country-based filtering of donations.';

-- Convert existing ISO codes to full country names
UPDATE surplus_posts SET country = 'Canada' WHERE country = 'CA';
UPDATE surplus_posts SET country = 'United States' WHERE country = 'US';
UPDATE surplus_posts SET country = 'Mexico' WHERE country = 'MX';
UPDATE surplus_posts SET country = 'United Kingdom' WHERE country = 'GB';
UPDATE surplus_posts SET country = 'France' WHERE country = 'FR';
UPDATE surplus_posts SET country = 'Germany' WHERE country = 'DE';
UPDATE surplus_posts SET country = 'Spain' WHERE country = 'ES';
UPDATE surplus_posts SET country = 'Italy' WHERE country = 'IT';
UPDATE surplus_posts SET country = 'Australia' WHERE country = 'AU';
UPDATE surplus_posts SET country = 'Japan' WHERE country = 'JP';
UPDATE surplus_posts SET country = 'China' WHERE country = 'CN';
UPDATE surplus_posts SET country = 'India' WHERE country = 'IN';
UPDATE surplus_posts SET country = 'Brazil' WHERE country = 'BR';
