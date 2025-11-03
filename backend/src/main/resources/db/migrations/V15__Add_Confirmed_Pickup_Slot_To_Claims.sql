-- Add confirmed pickup slot fields to claims table
-- These store the specific pickup time the receiver selected when claiming

ALTER TABLE claims
ADD COLUMN confirmed_pickup_date DATE,
ADD COLUMN confirmed_pickup_start_time TIME,
ADD COLUMN confirmed_pickup_end_time TIME;

-- Add comments to document the purpose
COMMENT ON COLUMN claims.confirmed_pickup_date IS 'The date the receiver selected for pickup';
COMMENT ON COLUMN claims.confirmed_pickup_start_time IS 'The start time of the pickup window the receiver selected';
COMMENT ON COLUMN claims.confirmed_pickup_end_time IS 'The end time of the pickup window the receiver selected';
