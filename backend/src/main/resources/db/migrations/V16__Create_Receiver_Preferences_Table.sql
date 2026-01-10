-- Create receiver_preferences table
CREATE TABLE receiver_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    preferred_food_types TEXT[], -- Array of food types
    max_capacity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    max_quantity INTEGER NOT NULL DEFAULT 0,
    preferred_pickup_windows TEXT[], -- Array of time windows (e.g., MORNING, AFTERNOON, EVENING)
    accept_refrigerated BOOLEAN NOT NULL DEFAULT TRUE,
    accept_frozen BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_receiver_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_capacity_positive CHECK (max_capacity > 0),
    CONSTRAINT chk_quantity_range CHECK (min_quantity <= max_quantity),
    CONSTRAINT chk_min_quantity_non_negative CHECK (min_quantity >= 0)
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_receiver_preferences_user_id ON receiver_preferences(user_id);

-- Add comment to the table
COMMENT ON TABLE receiver_preferences IS 'Stores receiver organization preferences for donation matching';
COMMENT ON COLUMN receiver_preferences.preferred_food_types IS 'Array of preferred food categories';
COMMENT ON COLUMN receiver_preferences.max_capacity IS 'Maximum items the receiver can handle per pickup';
COMMENT ON COLUMN receiver_preferences.min_quantity IS 'Minimum quantity of items the receiver will accept';
COMMENT ON COLUMN receiver_preferences.max_quantity IS 'Maximum quantity of items the receiver will accept';
COMMENT ON COLUMN receiver_preferences.preferred_pickup_windows IS 'Preferred time windows for pickup';
