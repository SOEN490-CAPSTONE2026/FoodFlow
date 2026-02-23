-- Create table for tracking calendar consent history (for privacy compliance)
CREATE TABLE calendar_consent_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    calendar_provider VARCHAR(50),
    action VARCHAR(50) NOT NULL,  -- 'GRANTED', 'REVOKED', 'SCOPES_CHANGED'
    scopes_granted TEXT,  -- JSON array of scopes approved
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create table for calendar sync audit logs (troubleshooting and monitoring)
CREATE TABLE calendar_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,  -- 'SYNC_STARTED', 'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED', 'SYNC_FAILED'
    event_id BIGINT,  -- synced_calendar_events ID
    external_event_id VARCHAR(255),
    event_type VARCHAR(50),
    status VARCHAR(20) NOT NULL,  -- 'SUCCESS', 'FAILED'
    error_message TEXT,
    duration_ms BIGINT,  -- How long the sync took
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for audit logs
CREATE INDEX idx_calendar_consent_history_user_id ON calendar_consent_history(user_id);
CREATE INDEX idx_calendar_consent_history_created_at ON calendar_consent_history(created_at DESC);
CREATE INDEX idx_calendar_sync_logs_user_id ON calendar_sync_logs(user_id);
CREATE INDEX idx_calendar_sync_logs_action ON calendar_sync_logs(action);
CREATE INDEX idx_calendar_sync_logs_status ON calendar_sync_logs(status);
