-- Payment System Tables for Stripe Integration
-- Migration V62: Create Payment Tables

-- Payment Entity
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Payment Methods (Tokenized - PCI Compliant)
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    payment_method_type VARCHAR(50) NOT NULL,
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    bank_name VARCHAR(255),
    bank_last4 VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_method_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Invoices
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    pdf_url TEXT,
    status VARCHAR(50) NOT NULL,
    due_date DATE,
    issued_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    subtotal_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Refunds
CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    processed_at TIMESTAMP,
    requested_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Payment Retry Logs
CREATE TABLE payment_retries (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    attempt_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_retry_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Webhook Events Log (for idempotency and debugging)
CREATE TABLE stripe_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Audit Trail
CREATE TABLE payment_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT REFERENCES payments(id),
    action VARCHAR(100) NOT NULL,
    actor_user_id BIGINT REFERENCES users(id),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_payments_organization ON payments(organization_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

CREATE INDEX idx_payment_methods_organization ON payment_methods(organization_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(is_default);

CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

CREATE INDEX idx_payment_retries_payment ON payment_retries(payment_id);
CREATE INDEX idx_payment_retries_next_retry ON payment_retries(next_retry_at);

CREATE INDEX idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_webhook_events_created ON stripe_webhook_events(created_at DESC);

CREATE INDEX idx_payment_audit_payment ON payment_audit_logs(payment_id);
CREATE INDEX idx_payment_audit_created ON payment_audit_logs(created_at DESC);
