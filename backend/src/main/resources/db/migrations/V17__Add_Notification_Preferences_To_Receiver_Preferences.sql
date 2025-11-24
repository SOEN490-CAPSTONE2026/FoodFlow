-- Add notification_preferences_enabled column to receiver_preferences table
ALTER TABLE receiver_preferences
ADD COLUMN notification_preferences_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment to document the column
COMMENT ON COLUMN receiver_preferences.notification_preferences_enabled IS 'Toggle for smart notifications based on preferences. When true, receivers only get notifications for matching posts. When false, receivers get all notifications.';
