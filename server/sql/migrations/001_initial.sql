-- Users are either anonymous guests or Google accounts.
CREATE TABLE users (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('guest', 'google')),
  email text,
  email_verified boolean NOT NULL DEFAULT false,
  name text,
  picture_url text,
  locale text,
  -- Aggregate stats imported once from the old localStorage build.
  legacy_stats jsonb,
  legacy_imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_google_needs_email CHECK (kind <> 'google' OR email IS NOT NULL)
);

CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE oauth_accounts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX oauth_accounts_user_idx ON oauth_accounts (user_id);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE oauth_states (
  state_hash text PRIMARY KEY,
  code_verifier text NOT NULL,
  nonce text NOT NULL,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX oauth_states_expires_idx ON oauth_states (expires_at);

-- The answer snapshot keeps history stable when the catalog or schedule changes.
CREATE TABLE daily_puzzles (
  puzzle_date date PRIMARY KEY,
  day_number integer NOT NULL,
  target_building_id text NOT NULL,
  target_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE games (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('daily', 'practice')),
  puzzle_date date,
  day_number integer,
  target_building_id text NOT NULL,
  target_snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT games_daily_date CHECK ((mode = 'daily') = (puzzle_date IS NOT NULL))
);

CREATE UNIQUE INDEX games_daily_user_unique ON games (user_id, puzzle_date)
  WHERE mode = 'daily';
CREATE INDEX games_user_idx ON games (user_id, updated_at DESC);
CREATE INDEX games_daily_date_idx ON games (puzzle_date) WHERE mode = 'daily';
CREATE INDEX games_created_idx ON games (created_at);

CREATE TABLE guesses (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  attempt integer NOT NULL CHECK (attempt BETWEEN 1 AND 6),
  building_id text NOT NULL,
  building_name text NOT NULL,
  cells jsonb NOT NULL,
  correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, attempt),
  UNIQUE (game_id, building_id)
);

CREATE INDEX guesses_game_idx ON guesses (game_id);
CREATE INDEX guesses_user_idx ON guesses (user_id, created_at);
CREATE INDEX guesses_building_idx ON guesses (building_id);
CREATE INDEX guesses_created_idx ON guesses (created_at);

-- One row per finished daily game. Stats and streaks derive from this table.
CREATE TABLE daily_results (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  puzzle_date date NOT NULL,
  day_number integer NOT NULL,
  status text NOT NULL CHECK (status IN ('won', 'lost')),
  attempts integer NOT NULL CHECK (attempts BETWEEN 1 AND 6),
  target_building_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, puzzle_date)
);

CREATE INDEX daily_results_user_idx ON daily_results (user_id, day_number);
CREATE INDEX daily_results_date_idx ON daily_results (puzzle_date);
CREATE INDEX daily_results_completed_idx ON daily_results (completed_at);
