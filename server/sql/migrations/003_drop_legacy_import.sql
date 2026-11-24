-- The one-time import from the old localStorage build was removed.
-- Stats now come only from daily_results.
ALTER TABLE users DROP COLUMN legacy_stats;
ALTER TABLE users DROP COLUMN legacy_imported_at;
