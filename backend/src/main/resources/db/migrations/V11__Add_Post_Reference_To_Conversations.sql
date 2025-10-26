-- Add surplus_post_id to conversations table to link conversations to donation posts
ALTER TABLE conversations
ADD COLUMN surplus_post_id BIGINT;

-- Add foreign key constraint
ALTER TABLE conversations
ADD CONSTRAINT fk_conversations_surplus_post
FOREIGN KEY (surplus_post_id) REFERENCES surplus_posts(id) ON DELETE CASCADE;

-- Create index for efficient querying by post
CREATE INDEX idx_conversations_surplus_post ON conversations(surplus_post_id);

-- Add comment explaining the relationship
COMMENT ON COLUMN conversations.surplus_post_id IS 'Links conversation to the surplus post it is related to';
