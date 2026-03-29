CREATE TABLE user_donation_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
    total_donated DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    last_donation_date TIMESTAMP,
    donation_count INTEGER NOT NULL DEFAULT 0
);
