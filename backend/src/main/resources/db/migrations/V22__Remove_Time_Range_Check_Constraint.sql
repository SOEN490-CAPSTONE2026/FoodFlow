-- Remove the time range check constraint that prevents cross-midnight pickups
-- This constraint was too restrictive as it didn't account for:
-- 1. Timezone conversions that can shift end times to the next day
-- 2. Legitimate cross-midnight pickup windows (e.g., 11 PM - 1 AM)

ALTER TABLE pickup_slots DROP CONSTRAINT IF EXISTS valid_time_range;
