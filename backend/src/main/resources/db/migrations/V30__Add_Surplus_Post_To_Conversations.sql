-- Add surplus_post_id column to conversations table
ALTER TABLE conversations 
ADD COLUMN surplus_post_id BIGINT;

-- Add foreign key constraint
ALTER TABLE conversations
ADD CONSTRAINT fk_conversations_surplus_post
FOREIGN KEY (surplus_post_id) REFERENCES surplus_posts(id) ON DELETE CASCADE;

-- Add comment explaining the relationship
COMMENT ON COLUMN conversations.surplus_post_id IS 'Links conversation to the surplus post it is related to';

-- Add index for efficient querying
CREATE INDEX idx_conversations_surplus_post ON conversations(surplus_post_id);
