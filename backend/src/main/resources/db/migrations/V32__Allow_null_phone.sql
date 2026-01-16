-- V33: Allow users.phone to be nullable to avoid failing inserts when phone is not provided
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
