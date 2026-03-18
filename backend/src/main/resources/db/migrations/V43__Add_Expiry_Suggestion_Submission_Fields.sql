ALTER TABLE surplus_posts
    ADD COLUMN IF NOT EXISTS user_provided_expiry_date DATE NULL,
    ADD COLUMN IF NOT EXISTS suggested_expiry_date DATE NULL,
    ADD COLUMN IF NOT EXISTS eligible_at_submission BOOLEAN NULL,
    ADD COLUMN IF NOT EXISTS warnings_at_submission JSONB NULL;

CREATE INDEX IF NOT EXISTS idx_surplus_posts_eligible_at_submission
    ON surplus_posts(eligible_at_submission);
