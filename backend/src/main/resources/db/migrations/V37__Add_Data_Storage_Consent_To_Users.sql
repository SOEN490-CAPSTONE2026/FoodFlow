-- Add data storage consent column to users table
ALTER TABLE users
ADD COLUMN data_storage_consent BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.data_storage_consent IS 'Indicates whether user has consented to data storage during registration';
