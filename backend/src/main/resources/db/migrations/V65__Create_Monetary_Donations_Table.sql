CREATE TABLE monetary_donations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    message TEXT,
    anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monetary_donations_user_id ON monetary_donations(user_id);
CREATE INDEX idx_monetary_donations_status ON monetary_donations(status);
CREATE INDEX idx_monetary_donations_created_at ON monetary_donations(created_at);
