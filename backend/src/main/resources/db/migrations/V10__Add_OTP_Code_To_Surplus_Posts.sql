-- Add OTP code field to surplus_posts table for pickup verification
ALTER TABLE surplus_posts
ADD COLUMN otp_code VARCHAR(6);

-- Index for potential OTP lookups
CREATE INDEX idx_surplus_posts_otp ON surplus_posts(otp_code);

-- Add comment explaining the field
COMMENT ON COLUMN surplus_posts.otp_code IS 'One-time password code for pickup verification between donor and receiver';
