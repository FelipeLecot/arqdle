-- The game now allows ten attempts instead of six.
ALTER TABLE games DROP CONSTRAINT games_attempts_check;
ALTER TABLE games ADD CONSTRAINT games_attempts_check CHECK (attempts BETWEEN 0 AND 10);

ALTER TABLE guesses DROP CONSTRAINT guesses_attempt_check;
ALTER TABLE guesses ADD CONSTRAINT guesses_attempt_check CHECK (attempt BETWEEN 1 AND 10);

ALTER TABLE daily_results DROP CONSTRAINT daily_results_attempts_check;
ALTER TABLE daily_results ADD CONSTRAINT daily_results_attempts_check CHECK (attempts BETWEEN 1 AND 10);
