ALTER TABLE refunds
    ALTER COLUMN stripe_refund_id DROP NOT NULL;

ALTER TABLE refunds
    ADD COLUMN reviewed_by BIGINT REFERENCES users(id),
    ADD COLUMN reviewed_at TIMESTAMP,
    ADD COLUMN admin_notes TEXT;
