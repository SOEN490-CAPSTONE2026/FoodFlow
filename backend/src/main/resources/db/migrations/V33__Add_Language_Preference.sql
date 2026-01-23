-- Add language_preference column to users table
-- Expects language codes like en, fr, es, etc.
-- Default to 'en' (English) for existing users
ALTER TABLE users
ADD COLUMN language_preference VARCHAR(5) NOT NULL DEFAULT 'en';
