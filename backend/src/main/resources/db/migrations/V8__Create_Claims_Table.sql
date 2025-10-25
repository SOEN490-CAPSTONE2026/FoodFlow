-- Create claims table
CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    surplus_post_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    
    FOREIGN KEY (surplus_post_id) REFERENCES surplus_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure one active claim per post
    CONSTRAINT unique_active_claim UNIQUE (surplus_post_id, status)
);

-- Indexes for efficient querying
CREATE INDEX idx_claims_surplus_post ON claims(surplus_post_id);
CREATE INDEX idx_claims_receiver ON claims(receiver_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_claimed_at ON claims(claimed_at DESC);

-- Add comment
COMMENT ON TABLE claims IS 'Tracks which receivers have claimed which surplus posts';
