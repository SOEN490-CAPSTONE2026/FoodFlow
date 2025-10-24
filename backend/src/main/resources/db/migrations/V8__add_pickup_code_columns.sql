ALTER TABLE surplus_posts
    ADD COLUMN pickup_code VARCHAR(6),
    ADD COLUMN pickup_code_expiration TIMESTAMP,
    ADD COLUMN pickup_timestamp TIMESTAMP;