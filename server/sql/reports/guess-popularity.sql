-- Most guessed buildings and the share of wrong guesses.
-- Usage:
--   psql "$DATABASE_URL" -v from=2026-11-01 -v to=2026-11-30 \
--     -f server/sql/reports/guess-popularity.sql

SELECT building_id,
       building_name,
       count(*) AS guesses,
       count(*) FILTER (WHERE correct) AS correct,
       count(*) FILTER (WHERE NOT correct) AS wrong,
       round(
         100.0 * count(*) FILTER (WHERE NOT correct) / NULLIF(count(*), 0),
         1
       ) AS wrong_pct
  FROM guesses
 WHERE created_at >= :'from'::date
   AND created_at < (:'to'::date + interval '1 day')
 GROUP BY building_id, building_name
 ORDER BY guesses DESC, building_name;
