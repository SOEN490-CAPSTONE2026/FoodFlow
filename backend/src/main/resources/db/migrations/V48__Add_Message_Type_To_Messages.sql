-- Add message type for system/user message classification
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS message_type VARCHAR(20);

UPDATE messages
SET message_type = 'USER'
WHERE message_type IS NULL;
