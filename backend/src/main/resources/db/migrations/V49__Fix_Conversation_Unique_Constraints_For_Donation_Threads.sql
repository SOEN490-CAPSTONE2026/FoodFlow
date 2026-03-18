-- Old constraint blocked multiple donation threads between the same donor/receiver pair.
-- Replace it with:
-- 1) Direct chats (no donation) unique by user pair
-- 2) Donation chats unique by (surplus_post_id, receiver_id)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'conversations_user1_id_user2_id_key'
    ) THEN
        ALTER TABLE conversations
            DROP CONSTRAINT conversations_user1_id_user2_id_key;
    END IF;
END $$;

-- Keep direct message uniqueness for legacy non-donation conversations only.
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_direct_pair
    ON conversations(user1_id, user2_id)
    WHERE surplus_post_id IS NULL;

-- Enforce marketplace thread uniqueness: one thread per donation+receiver.
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_donation_receiver
    ON conversations(surplus_post_id, receiver_id)
    WHERE surplus_post_id IS NOT NULL AND receiver_id IS NOT NULL;
