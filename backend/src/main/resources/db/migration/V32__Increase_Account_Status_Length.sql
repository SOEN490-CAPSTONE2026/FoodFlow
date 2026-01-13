-- Increase account_status column length to accommodate PENDING_ADMIN_APPROVAL (23 characters)
ALTER TABLE users ALTER COLUMN account_status TYPE VARCHAR(30);
