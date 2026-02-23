-- Add fields required by donation-anchored conversation threads
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS donor_id BIGINT,
    ADD COLUMN IF NOT EXISTS receiver_id BIGINT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
    ADD COLUMN IF NOT EXISTS donation_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS donation_photo TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_conversations_donor'
    ) THEN
        ALTER TABLE conversations
            ADD CONSTRAINT fk_conversations_donor
            FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_conversations_receiver'
    ) THEN
        ALTER TABLE conversations
            ADD CONSTRAINT fk_conversations_receiver
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_donor ON conversations(donor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_receiver ON conversations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
