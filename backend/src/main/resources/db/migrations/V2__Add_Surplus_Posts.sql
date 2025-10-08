-- Create surplus_posts table (OLD structure before frontend changes)
CREATE TABLE surplus_posts (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    quantity VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    pickup_time TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    donor_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_surplus_posts_donor_id ON surplus_posts(donor_id);
CREATE INDEX idx_surplus_posts_expiry_date ON surplus_posts(expiry_date);
CREATE INDEX idx_surplus_posts_created_at ON surplus_posts(created_at);
