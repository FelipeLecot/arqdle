-- Wins by attempt count for each daily puzzle.
-- Usage:
--   psql "$DATABASE_URL" -v from=2026-11-01 -v to=2026-11-30 \
--     -f server/sql/reports/attempt-distribution.sql

SELECT puzzle_date,
       attempts,
       count(*) AS finished_games,
       count(*) FILTER (WHERE status = 'won') AS wins,
       count(*) FILTER (WHERE status = 'lost') AS losses
  FROM daily_results
 WHERE puzzle_date BETWEEN :'from'::date AND :'to'::date
 GROUP BY puzzle_date, attempts
 ORDER BY puzzle_date, attempts;
