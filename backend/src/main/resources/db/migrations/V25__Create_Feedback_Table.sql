-- Flyway migration script for feedback table

CREATE TABLE feedback (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_feedback_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate reviews from same person for same claim
    CONSTRAINT uk_feedback_claim_reviewer UNIQUE (claim_id, reviewer_id),
    
    -- Check constraint to ensure reviewer and reviewee are different
    CONSTRAINT chk_feedback_different_users CHECK (reviewer_id != reviewee_id)
);

-- Indexes for performance
CREATE INDEX idx_feedback_claim_id ON feedback(claim_id);
CREATE INDEX idx_feedback_reviewer_id ON feedback(reviewer_id);
CREATE INDEX idx_feedback_reviewee_id ON feedback(reviewee_id);
CREATE INDEX idx_feedback_reviewee_created_at ON feedback(reviewee_id, created_at DESC);
CREATE INDEX idx_feedback_rating ON feedback(rating);

-- Comments for documentation
COMMENT ON TABLE feedback IS 'Stores feedback/ratings between donors and receivers for completed donations';
COMMENT ON COLUMN feedback.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN feedback.review_text IS 'Optional written review (max 500 chars enforced by application)';
COMMENT ON COLUMN feedback.reviewer_id IS 'User who is giving the feedback';
COMMENT ON COLUMN feedback.reviewee_id IS 'User who is receiving the feedback';