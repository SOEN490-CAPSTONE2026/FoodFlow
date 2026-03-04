-- Add new calendar preference fields to support UI settings
ALTER TABLE calendar_sync_preferences
ADD COLUMN reminder_type VARCHAR(50) DEFAULT 'EMAIL',
ADD COLUMN event_color VARCHAR(50) DEFAULT 'BLUE',
ADD COLUMN event_visibility VARCHAR(50) DEFAULT 'PRIVATE',
ADD COLUMN event_duration INTEGER DEFAULT 15;

-- Add comments for clarity
COMMENT ON COLUMN calendar_sync_preferences.reminder_type IS 'Type of reminder: EMAIL, POPUP, etc.';
COMMENT ON COLUMN calendar_sync_preferences.event_color IS 'Color code for calendar events: BLUE, RED, GREEN, etc.';
COMMENT ON COLUMN calendar_sync_preferences.event_visibility IS 'Visibility of calendar events: PRIVATE, PUBLIC';
COMMENT ON COLUMN calendar_sync_preferences.event_duration IS 'Default duration for calendar events in minutes';
