-- Add supporting_document_url column to organizations table
-- This stores the URL of uploaded license/verification documents during registration
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS supporting_document_url TEXT;
