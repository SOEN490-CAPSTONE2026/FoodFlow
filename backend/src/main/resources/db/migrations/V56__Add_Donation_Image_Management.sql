CREATE TABLE IF NOT EXISTS donation_images (
    id BIGSERIAL PRIMARY KEY,
    donor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    donation_id BIGINT REFERENCES surplus_posts(id) ON DELETE SET NULL,
    food_type VARCHAR(50),
    url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    original_file_name VARCHAR(255),
    content_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    moderated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP,
    reason TEXT,
    CONSTRAINT chk_donation_images_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED')),
    CONSTRAINT chk_donation_images_food_type
        CHECK (food_type IS NULL OR food_type IN (
            'PREPARED',
            'PRODUCE',
            'BAKERY',
            'DAIRY_EGGS',
            'MEAT_POULTRY',
            'SEAFOOD',
            'PANTRY',
            'BEVERAGES'
        ))
);

CREATE INDEX IF NOT EXISTS idx_donation_images_donor_id ON donation_images(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_images_status ON donation_images(status);
CREATE INDEX IF NOT EXISTS idx_donation_images_food_type ON donation_images(food_type);

CREATE TABLE IF NOT EXISTS internal_image_library (
    id BIGSERIAL PRIMARY KEY,
    food_type VARCHAR(50),
    url TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_internal_image_library_food_type
        CHECK (food_type IS NULL OR food_type IN (
            'PREPARED',
            'PRODUCE',
            'BAKERY',
            'DAIRY_EGGS',
            'MEAT_POULTRY',
            'SEAFOOD',
            'PANTRY',
            'BEVERAGES'
        ))
);

CREATE INDEX IF NOT EXISTS idx_internal_image_library_food_type_active
    ON internal_image_library(food_type, active);

CREATE TABLE IF NOT EXISTS donor_photo_preferences (
    id BIGSERIAL PRIMARY KEY,
    donor_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
    single_image_id BIGINT REFERENCES donation_images(id) ON DELETE SET NULL,
    single_library_image_id BIGINT REFERENCES internal_image_library(id) ON DELETE SET NULL,
    per_food_type_map JSONB NOT NULL DEFAULT '{}'::jsonb,
    per_food_type_library_map JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_donor_photo_preferences_display_type
        CHECK (display_type IN ('SINGLE', 'PER_FOOD_TYPE'))
);

CREATE INDEX IF NOT EXISTS idx_donor_photo_preferences_donor_id
    ON donor_photo_preferences(donor_id);

INSERT INTO internal_image_library (food_type, url, active)
VALUES
    ('PRODUCE', 'https://placehold.co/600x400/png?text=FoodFlow+Produce', TRUE),
    ('DAIRY_EGGS', 'https://placehold.co/600x400/png?text=FoodFlow+Dairy', TRUE),
    ('MEAT_POULTRY', 'https://placehold.co/600x400/png?text=FoodFlow+Meat', TRUE),
    ('BAKERY', 'https://placehold.co/600x400/png?text=FoodFlow+Bakery', TRUE),
    ('PREPARED', 'https://placehold.co/600x400/png?text=FoodFlow+Prepared', TRUE),
    ('SEAFOOD', 'https://placehold.co/600x400/png?text=FoodFlow+Seafood', TRUE),
    ('PANTRY', 'https://placehold.co/600x400/png?text=FoodFlow+Pantry', TRUE),
    ('BEVERAGES', 'https://placehold.co/600x400/png?text=FoodFlow+Beverages', TRUE),
    (NULL, 'https://placehold.co/600x400/png?text=FoodFlow+Donation', TRUE);
