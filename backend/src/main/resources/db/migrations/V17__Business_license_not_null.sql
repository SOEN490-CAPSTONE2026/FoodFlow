-- Fill missing business_license values with a placeholder
UPDATE organizations
SET business_license = 'PENDING_LICENSE'
WHERE business_license IS NULL;

-- Apply NOT NULL constraint to business_license column
ALTER TABLE organizations
ALTER COLUMN business_license SET NOT NULL;
