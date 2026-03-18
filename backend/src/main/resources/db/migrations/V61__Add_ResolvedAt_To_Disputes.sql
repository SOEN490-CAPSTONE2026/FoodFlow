-- Migration: Add resolved_at column to disputes table
-- Fixes: Average Wait Time metric showing negative values (Issue #420)
--
-- The resolved_at column records the exact timestamp when a dispute was
-- transitioned to RESOLVED or CLOSED status. This is used to accurately
-- calculate average resolution time (submission → resolution) and ensures
-- the metric is always non-negative.
--
-- For existing resolved/closed disputes that predate this migration,
-- we use updated_at as a best-effort approximation of when they were resolved.

ALTER TABLE disputes
    ADD COLUMN resolved_at TIMESTAMP NULL;

-- Back-fill resolved_at for existing RESOLVED/CLOSED disputes
-- using updated_at as the best available approximation
UPDATE disputes
SET resolved_at = updated_at
WHERE status IN ('RESOLVED', 'CLOSED')
  AND resolved_at IS NULL
  AND updated_at IS NOT NULL;

