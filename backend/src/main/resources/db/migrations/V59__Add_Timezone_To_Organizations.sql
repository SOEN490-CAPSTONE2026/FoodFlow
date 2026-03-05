-- V57__Add_Timezone_To_Organizations.sql
-- Add timezone column to organizations table for automatic timezone detection

ALTER TABLE organizations
ADD COLUMN timezone VARCHAR(255);

-- Set default timezone to 'UTC' for existing records
UPDATE organizations
SET timezone = 'UTC'
WHERE timezone IS NULL;
