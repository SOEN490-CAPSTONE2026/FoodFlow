-- Add region and timezone columns to users table
ALTER TABLE users 
ADD COLUMN country VARCHAR(100),
ADD COLUMN city VARCHAR(100),
ADD COLUMN timezone VARCHAR(50);

-- Create index for timezone queries
CREATE INDEX idx_users_timezone ON users(timezone);

-- Add comments for documentation
COMMENT ON COLUMN users.country IS 'User selected country';
COMMENT ON COLUMN users.city IS 'User selected city';
COMMENT ON COLUMN users.timezone IS 'Resolved timezone identifier (e.g., America/Toronto)';
