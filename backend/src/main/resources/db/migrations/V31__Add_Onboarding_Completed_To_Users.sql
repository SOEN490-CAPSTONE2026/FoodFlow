-- Add onboarding_completed column to users table
ALTER TABLE users
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users to have completed onboarding
UPDATE users
SET onboarding_completed = TRUE;
