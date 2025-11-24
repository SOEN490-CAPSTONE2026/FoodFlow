-- Add charity_registration_number to organizations
ALTER TABLE organizations
ADD COLUMN charity_registration_number VARCHAR(255);

-- Optional index for faster lookup by charity registration number
CREATE INDEX IF NOT EXISTS idx_organizations_charity_registration_number ON organizations(charity_registration_number);
