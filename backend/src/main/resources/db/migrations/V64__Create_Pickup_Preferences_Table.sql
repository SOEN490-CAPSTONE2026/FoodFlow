-- Pickup Preferences for Donors

CREATE TABLE pickup_preferences (
    id BIGSERIAL PRIMARY KEY,
    donor_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    availability_window_start TIME,
    availability_window_end TIME,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_availability_window CHECK (
        availability_window_end IS NULL
        OR availability_window_start IS NULL
        OR availability_window_end > availability_window_start
    )
);

CREATE TABLE pickup_preference_slots (
    id BIGSERIAL PRIMARY KEY,
    preference_id BIGINT NOT NULL REFERENCES pickup_preferences(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    slot_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_slot_times CHECK (end_time > start_time),
    CONSTRAINT uq_preference_slot_order UNIQUE (preference_id, slot_order)
);

CREATE INDEX idx_pickup_preferences_donor_id ON pickup_preferences(donor_id);
CREATE INDEX idx_pickup_preference_slots_preference_id ON pickup_preference_slots(preference_id);
