-- V23: Add donation timeline tracking and flagging system for admin management

-- Add flagged and flag_reason fields to surplus_posts
ALTER TABLE surplus_posts 
ADD COLUMN flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN flag_reason TEXT;

-- Create donation_timeline table for tracking donation events
CREATE TABLE donation_timeline (
    id BIGSERIAL PRIMARY KEY,
    surplus_post_id BIGINT NOT NULL REFERENCES surplus_posts(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(50) NOT NULL, -- 'admin', 'donor', 'receiver', 'system'
    actor_user_id BIGINT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    details TEXT,
    visible_to_users BOOLEAN DEFAULT TRUE, -- false for admin-only events
    temperature DOUBLE PRECISION,
    packaging_condition VARCHAR(100),
    pickup_evidence_url VARCHAR(255),
    CONSTRAINT fk_timeline_surplus_post FOREIGN KEY (surplus_post_id) REFERENCES surplus_posts(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_timeline_surplus_post_id ON donation_timeline(surplus_post_id);
CREATE INDEX IF NOT EXISTS idx_timeline_timestamp ON donation_timeline(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_actor ON donation_timeline(actor);
CREATE INDEX IF NOT EXISTS idx_surplus_posts_flagged ON surplus_posts(flagged) WHERE flagged = TRUE;
-- Note: idx_surplus_posts_status already exists, skipping

-- Add comments for documentation
COMMENT ON TABLE donation_timeline IS 'Tracks all events and status changes for donations, including admin interventions';
COMMENT ON COLUMN donation_timeline.visible_to_users IS 'If false, this timeline event is only visible to admins (e.g., admin overrides)';
COMMENT ON COLUMN surplus_posts.flagged IS 'Indicates if donation has been flagged by admin for compliance or quality issues';
COMMENT ON COLUMN surplus_posts.flag_reason IS 'Admin notes explaining why donation was flagged';
