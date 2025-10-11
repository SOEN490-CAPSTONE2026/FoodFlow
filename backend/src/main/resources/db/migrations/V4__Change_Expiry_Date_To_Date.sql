-- Change expiry_date from TIMESTAMP to DATE
ALTER TABLE surplus_posts 
    ALTER COLUMN expiry_date TYPE DATE 
    USING expiry_date::DATE;
