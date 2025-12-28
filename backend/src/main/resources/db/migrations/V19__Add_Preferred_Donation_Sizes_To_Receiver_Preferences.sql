-- Add preferred_donation_sizes column to receiver_preferences table
ALTER TABLE receiver_preferences
ADD COLUMN preferred_donation_sizes text array DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN receiver_preferences.preferred_donation_sizes IS 'Preferred donation sizes: SMALL, MEDIUM, LARGE, BULK';
