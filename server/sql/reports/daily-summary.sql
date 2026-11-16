-- Daily play, win rate and attempt distribution.
-- Usage:
--   psql "$DATABASE_URL" -v from=2026-11-01 -v to=2026-11-30 \
--     -f server/sql/reports/daily-summary.sql

SELECT p.puzzle_date AS date,
       p.day_number,
       p.target_building_id,
       p.target_snapshot->>'name' AS building,
       count(r.user_id) AS players,
       count(*) FILTER (WHERE r.status = 'won') AS wins,
       count(*) FILTER (WHERE r.status = 'lost') AS losses,
       round(
         100.0 * count(*) FILTER (WHERE r.status = 'won') / NULLIF(count(r.user_id), 0),
         1
       ) AS win_rate_pct,
       round(avg(r.attempts), 2) AS avg_attempts,
       count(*) FILTER (WHERE r.status = 'won' AND r.attempts = 1) AS first_try_wins
  FROM daily_puzzles p
  LEFT JOIN daily_results r ON r.puzzle_date = p.puzzle_date
 WHERE p.puzzle_date BETWEEN :'from'::date AND :'to'::date
 GROUP BY p.puzzle_date, p.day_number, p.target_building_id, p.target_snapshot->>'name'
 ORDER BY p.puzzle_date;
