-- Add connection details columns to calendar_integrations table
-- These fields store metadata about the user's Google Calendar connection

-- Primary calendar name (e.g., "user@gmail.com" or custom calendar name)
ALTER TABLE calendar_integrations 
ADD COLUMN primary_calendar_name VARCHAR(255);

-- Calendar time zone (e.g., "America/Toronto", "UTC")
ALTER TABLE calendar_integrations 
ADD COLUMN calendar_time_zone VARCHAR(100);

-- Granted scopes (comma-separated list of OAuth scopes)
-- Example: "https://www.googleapis.com/auth/calendar"
ALTER TABLE calendar_integrations 
ADD COLUMN granted_scopes TEXT;

-- Last successful sync timestamp (when events were successfully synced)
ALTER TABLE calendar_integrations 
ADD COLUMN last_successful_sync TIMESTAMP;

-- Last failed token refresh timestamp (when token refresh failed)
ALTER TABLE calendar_integrations 
ADD COLUMN last_failed_refresh TIMESTAMP;

-- Add comment to clarify that created_at represents "connected since"
COMMENT ON COLUMN calendar_integrations.created_at IS 'Timestamp when user first connected their calendar (Connected Since)';
