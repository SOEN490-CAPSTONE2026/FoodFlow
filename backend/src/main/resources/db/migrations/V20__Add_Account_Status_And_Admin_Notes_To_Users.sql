-- Add account status and admin-related fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_by BIGINT;

-- Create admin user (only if doesn't exist)
-- Using the same BCrypt hash from your working test accounts for password "testpass123"
-- This ensures compatibility with your Spring Security BCrypt configuration
INSERT INTO users (email, password, role, account_status, created_at, updated_at)
SELECT 'admin@foodflow.com', 
       '$2a$10$QnvBEqmxilLL8NU.WzG0WeMcATGPAi3UdPNDT.kja5y2sAqKgq916', 
       'ADMIN', 
       'ACTIVE', 
       CURRENT_TIMESTAMP, 
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@foodflow.com');

-- Add index for performance (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
-- idx_users_role already exists from earlier migration, skip it
