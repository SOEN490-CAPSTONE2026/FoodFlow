-- Create disputes table for the ticket/case system
CREATE TABLE IF NOT EXISTS disputes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    reported_id BIGINT NOT NULL,
    donation_id BIGINT,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    admin_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_disputes_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT fk_disputes_reported FOREIGN KEY (reported_id) REFERENCES users(id),
    CONSTRAINT fk_disputes_donation FOREIGN KEY (donation_id) REFERENCES surplus_posts(id) ON DELETE SET NULL,
    CONSTRAINT chk_disputes_status CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'))
);

-- Create indexes for better query performance
CREATE INDEX idx_disputes_reporter ON disputes(reporter_id);
CREATE INDEX idx_disputes_reported ON disputes(reported_id);
CREATE INDEX idx_disputes_donation ON disputes(donation_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);
