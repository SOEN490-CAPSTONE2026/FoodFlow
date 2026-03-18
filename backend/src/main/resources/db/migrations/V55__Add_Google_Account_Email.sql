-- Add Google account email field to calendar_integrations table
-- This stores the Google account email (from calendar ID)
-- which is different from the calendar name

ALTER TABLE calendar_integrations 
ADD COLUMN google_account_email VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX idx_calendar_integrations_google_email ON calendar_integrations(google_account_email);
