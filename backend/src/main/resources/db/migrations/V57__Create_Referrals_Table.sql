-- Flyway migration script for referrals table

CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    submitter_id BIGINT NOT NULL,
    referral_type VARCHAR(30) NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_referral_submitter FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_referral_type CHECK (referral_type IN ('INVITE_COMMUNITY', 'SUGGEST_BUSINESS'))
);

CREATE INDEX idx_referrals_submitter_id ON referrals(submitter_id);
CREATE INDEX idx_referrals_type ON referrals(referral_type);
CREATE INDEX idx_referrals_created_at ON referrals(created_at DESC);

COMMENT ON TABLE referrals IS 'Stores referral/invite submissions from donors and receivers';
COMMENT ON COLUMN referrals.referral_type IS 'INVITE_COMMUNITY (from receivers) or SUGGEST_BUSINESS (from donors)';
COMMENT ON COLUMN referrals.business_name IS 'Name of the community org or business being suggested';
COMMENT ON COLUMN referrals.contact_email IS 'Contact email for the referred organization';
COMMENT ON COLUMN referrals.message IS 'Optional personalized message from the submitter';
