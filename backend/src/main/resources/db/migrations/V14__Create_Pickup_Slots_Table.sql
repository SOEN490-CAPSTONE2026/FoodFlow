-- Create pickup_slots table for multiple pickup time slots per surplus post
CREATE TABLE pickup_slots (
    id BIGSERIAL PRIMARY KEY,
    surplus_post_id BIGINT NOT NULL,
    pickup_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    slot_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pickup_slots_surplus_post 
        FOREIGN KEY (surplus_post_id) 
        REFERENCES surplus_posts(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_slot_order 
        UNIQUE (surplus_post_id, slot_order),
    CONSTRAINT valid_time_range 
        CHECK (end_time > start_time)
);

-- Create index for faster lookups by surplus post
CREATE INDEX idx_pickup_slots_post_id ON pickup_slots(surplus_post_id);

-- Migrate existing data: Create a slot for each existing surplus post
-- This ensures backward compatibility
INSERT INTO pickup_slots (surplus_post_id, pickup_date, start_time, end_time, slot_order)
SELECT id, pickup_date, pickup_from, pickup_to, 1
FROM surplus_posts
WHERE pickup_date IS NOT NULL 
  AND pickup_from IS NOT NULL 
  AND pickup_to IS NOT NULL;
