-- Step 4/5/6: Expiry prediction storage, effective expiry, override audit, and notification dedupe logs

ALTER TABLE surplus_posts
    ALTER COLUMN expiry_date DROP NOT NULL;

ALTER TABLE surplus_posts
    ADD COLUMN IF NOT EXISTS expiry_date_predicted TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS expiry_date_effective TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS expiry_prediction_confidence DOUBLE PRECISION NULL,
    ADD COLUMN IF NOT EXISTS expiry_prediction_version VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS expiry_prediction_inputs JSONB NULL,
    ADD COLUMN IF NOT EXISTS expiry_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS expiry_override_reason VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS expiry_overridden_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS expiry_overridden_by BIGINT NULL;

-- Backfill effective expiry for existing rows from donor-provided expiry_date (as end-of-day).
UPDATE surplus_posts
SET expiry_date_effective = COALESCE(
    expiry_date_effective,
    CASE
        WHEN expiry_date IS NOT NULL THEN (expiry_date::timestamp + INTERVAL '23 hours 59 minutes 59 seconds')
        ELSE NULL
    END
);

CREATE INDEX IF NOT EXISTS idx_surplus_posts_status_effective_expiry
    ON surplus_posts(status, expiry_date_effective);

CREATE INDEX IF NOT EXISTS idx_surplus_posts_effective_expiry
    ON surplus_posts(expiry_date_effective);

CREATE TABLE IF NOT EXISTS expiry_audit_log (
    id BIGSERIAL PRIMARY KEY,
    surplus_post_id BIGINT NOT NULL REFERENCES surplus_posts(id) ON DELETE CASCADE,
    actor_id BIGINT NULL,
    event_type VARCHAR(50) NOT NULL,
    previous_effective TIMESTAMP NULL,
    new_effective TIMESTAMP NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expiry_audit_log_post_id ON expiry_audit_log(surplus_post_id);
CREATE INDEX IF NOT EXISTS idx_expiry_audit_log_created_at ON expiry_audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS expiry_notification_log (
    id BIGSERIAL PRIMARY KEY,
    surplus_post_id BIGINT NOT NULL REFERENCES surplus_posts(id) ON DELETE CASCADE,
    threshold_hours INTEGER NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    channel VARCHAR(20) NOT NULL,
    dedupe_key VARCHAR(255) NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_expiry_notification_log_post_id ON expiry_notification_log(surplus_post_id);
CREATE INDEX IF NOT EXISTS idx_expiry_notification_log_threshold ON expiry_notification_log(threshold_hours);
