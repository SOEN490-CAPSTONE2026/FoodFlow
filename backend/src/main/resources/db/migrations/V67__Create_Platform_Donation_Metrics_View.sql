-- Aggregated view for platform-wide monetary donation metrics
CREATE OR REPLACE VIEW platform_donation_metrics AS
SELECT
    COALESCE(SUM(md.amount), 0)                         AS total_amount_donated,
    COUNT(md.id)                                         AS total_donation_count,
    COUNT(DISTINCT md.user_id)                           AS total_unique_donors,
    COALESCE(AVG(md.amount), 0)                          AS average_donation_amount,
    COALESCE(MAX(md.amount), 0)                          AS largest_donation,
    COALESCE(MIN(md.amount), 0)                          AS smallest_donation,
    COUNT(CASE WHEN md.anonymous = true THEN 1 END)      AS anonymous_donation_count,
    COUNT(CASE WHEN md.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)  AS donations_last_30_days,
    COALESCE(SUM(CASE WHEN md.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN md.amount ELSE 0 END), 0) AS amount_last_30_days,
    COUNT(CASE WHEN md.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)   AS donations_last_7_days,
    COALESCE(SUM(CASE WHEN md.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN md.amount ELSE 0 END), 0)  AS amount_last_7_days
FROM monetary_donations md
WHERE md.status = 'COMPLETED';
