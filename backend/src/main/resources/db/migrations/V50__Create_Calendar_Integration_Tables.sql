-- Create table for storing user calendar integrations
CREATE TABLE calendar_integrations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    calendar_provider VARCHAR(50) NOT NULL,  -- 'GOOGLE', 'OUTLOOK', etc.
    is_connected BOOLEAN DEFAULT FALSE,
    refresh_token TEXT,  -- Encrypted in application layer
    access_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create table for calendar sync preferences
CREATE TABLE calendar_sync_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_pickup_events BOOLEAN DEFAULT TRUE,
    sync_delivery_events BOOLEAN DEFAULT TRUE,
    sync_claim_events BOOLEAN DEFAULT TRUE,
    auto_create_reminders BOOLEAN DEFAULT TRUE,
    reminder_minutes_before INTEGER DEFAULT 30,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create table to track calendar events synced from FoodFlow to external calendars
CREATE TABLE synced_calendar_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    donation_id BIGINT,  -- Reference to donation/surplus post
    claim_id BIGINT,  -- Reference to claim if applicable
    external_event_id VARCHAR(255),  -- ID from external calendar (Google, Outlook)
    event_type VARCHAR(50) NOT NULL,  -- 'PICKUP', 'DELIVERY', 'CLAIM'
    event_title VARCHAR(255),
    event_description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    timezone VARCHAR(100),
    sync_status VARCHAR(50) DEFAULT 'SYNCED',  -- 'SYNCED', 'PENDING', 'FAILED'
    last_sync_error TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (donation_id) REFERENCES surplus_posts(id) ON DELETE SET NULL,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(calendar_provider);
CREATE INDEX idx_calendar_sync_preferences_user_id ON calendar_sync_preferences(user_id);
CREATE INDEX idx_synced_calendar_events_user_id ON synced_calendar_events(user_id);
CREATE INDEX idx_synced_calendar_events_external_id ON synced_calendar_events(external_event_id);
CREATE INDEX idx_synced_calendar_events_donation_id ON synced_calendar_events(donation_id);
CREATE INDEX idx_synced_calendar_events_claim_id ON synced_calendar_events(claim_id);
CREATE INDEX idx_synced_calendar_events_sync_status ON synced_calendar_events(sync_status);
