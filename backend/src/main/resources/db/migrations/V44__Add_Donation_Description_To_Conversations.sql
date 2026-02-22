-- Add donation description snapshot field to conversation threads
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS donation_description TEXT;

COMMENT ON COLUMN conversations.donation_description IS
'Snapshot of donation description for donation-anchored conversation context';
