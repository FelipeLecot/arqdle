-- New daily players and how many returned within seven days.
-- Usage:
--   psql "$DATABASE_URL" -v from=2026-11-01 -v to=2026-11-30 \
--     -f server/sql/reports/retention.sql

WITH first_play AS (
  SELECT user_id, min(puzzle_date) AS first_date
    FROM daily_results
   GROUP BY user_id
)
SELECT f.first_date AS date,
       count(*) AS new_players,
       count(*) FILTER (
         WHERE EXISTS (
           SELECT 1
             FROM daily_results r
            WHERE r.user_id = f.user_id
              AND r.puzzle_date > f.first_date
              AND r.puzzle_date <= f.first_date + 7
         )
       ) AS returned_within_7_days
  FROM first_play f
 WHERE f.first_date BETWEEN :'from'::date AND :'to'::date
 GROUP BY f.first_date
 ORDER BY f.first_date;
