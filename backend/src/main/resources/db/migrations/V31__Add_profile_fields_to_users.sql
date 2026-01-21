-- Add profile fields to users table (full name, phone, profile photo)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
    ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Ensure phone is not null; set empty default for existing rows
UPDATE users SET phone = '' WHERE phone IS NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;