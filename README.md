# Arqdle

A Wordle-style daily architecture guessing game. Type a building name or an
architect, pick it from the autocomplete list, and compare eight clues against the
hidden building. Green is an exact match, yellow is close, and red is a miss. You
get ten guesses.

The interface and building copy are available in English and Spanish. Spanish is
the default. Use the `ES` / `EN` button in the header, or open `?lang=en` for
English.

Profiles, games, guesses, daily results and stats live in Postgres. Anonymous
visitors get a database-backed guest profile. Google sign-in upgrades that guest, or
merges it into an existing account, so progress follows the player across devices.

## Run it locally

Requires Node 22.12 or newer and Docker with Compose.

```sh
npm install
cp .env.example .env

# Start the development Postgres database.
docker compose up -d db

# The server also runs migrations on boot. This command is available for manual runs.
npm run db:migrate

npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies API requests to the Express
server on port 3001.

For an unlimited development game, switch to the **Practice** tab, or open
<http://localhost:5173/?mode=practice>. Add `&lang=en` for English.

The Docker Compose file starts Postgres only. The app runs with `npm` so server and
client changes reload quickly.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port for the API and the production site. |
| `SITE_URL` | empty | Public origin for canonical, Open Graph, sitemap and default OAuth redirect URLs. No trailing slash. |
| `DATABASE_URL` | required | PostgreSQL connection string, for example `postgres://arqdle:password@host:5432/arqdle`. |
| `DATABASE_SSL` | `disable` on localhost, `require` elsewhere | `disable`, `require`, or `verify-full`. |
| `DATABASE_CA_CERT` | empty | PEM certificate or path to the CA used by `verify-full`. |
| `DB_AUTO_MIGRATE` | `true` | Run pending migrations when the server starts. |
| `SESSION_TTL_DAYS` | `30` | Session lifetime. Active sessions slide forward. |
| `COOKIE_SECURE` | `true` in production | Set `false` only when the site is served over plain HTTP. |
| `COOKIE_DOMAIN` | empty | Optional cookie domain for a parent domain. |
| `GOOGLE_CLIENT_ID` | empty | Google OAuth web client ID. |
| `GOOGLE_CLIENT_SECRET` | empty | Google OAuth web client secret. |
| `GOOGLE_REDIRECT_URI` | `${SITE_URL}/api/auth/google/callback` | Must match the Google Cloud redirect URI exactly. |
| `ADMIN_EMAILS` | empty | Comma-separated Google account emails that can read analytics. |
| `ADMIN_TOKEN` | empty | Optional bearer token for scripted analytics and CSV exports. |
| `PUZZLE_TIMEZONE` | `America/Montevideo` | Time zone used to decide when the daily puzzle changes. |
| `DAILY_EPOCH` | `2026-11-16` | Day 1 of the daily sequence. |
| `DAILY_SEED` | `arqdle-2026` | Seed for the deterministic daily order. |
| `DAILY_SCHEDULE` | `server/data/daily.json` | Optional JSON file that pins answers to dates. |
| `WIKIMEDIA_USER_AGENT` | `Arqdle/1.0 (self-hosted architecture guessing game)` | Descriptive User-Agent for Wikimedia image requests. |
| `GUEST_RETENTION_DAYS` | `90` | Age limit used by `npm run db:cleanup-guests`. |

`WIKIMEDIA_IMAGES=off` disables photo lookups. The test suite uses it to avoid
network calls.

## Google sign-in

Create a **Web application** OAuth client in Google Cloud Console:

1. Configure the OAuth consent screen. The app only needs `openid`, `email`, and
   `profile`.
2. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback`
   - `https://your-domain.example/api/auth/google/callback`
3. Put the client ID and secret in `.env`:
   ```sh
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://your-domain.example/api/auth/google/callback
   ```
4. Restart the server. The sign-in button appears for guests.

Leave both credentials empty to disable sign-in. The button is hidden and
`/api/auth/google/start` returns `503 google_not_configured`.

The flow uses state, PKCE S256, and a nonce. The ID token signature is verified
against Google's JWKS, and the email must be verified. The app links the stable
Google subject to a local user. It does **not** store Google access or refresh
tokens.

### Guest upgrade and account recovery

- A visitor without a session gets a guest row and an HttpOnly session cookie.
- The first Google sign-in upgrades that guest in place when the Google account is
  new.
- If the Google account already exists, guest progress is merged into it.
- A winning daily result beats a loss. If both results are wins, the one with fewer
  attempts wins. Practice games are always kept.
- The guest row is deleted after a successful merge.

Session tokens are random, stored only as SHA-256 hashes, and rotated on sign-in.
Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

## Database and migrations

SQL migrations live in `server/sql/migrations/` and run in filename order. The
runner records a checksum in `schema_migrations`, so an applied migration must not
be edited. Add a new migration instead.

```sh
npm run db:up             # start local Postgres
npm run db:migrate        # apply migrations from source
npm run db:migrate:prod   # apply migrations from the production build
npm run db:down           # stop local Postgres
npm run db:reset          # delete the local volume and recreate the database
npm run db:cleanup-guests # delete old empty guest profiles
npm run db:cleanup-guests:prod # same, from the production build
```

Tables:

| Table | Purpose |
| --- | --- |
| `users` | Guest and Google profiles, timestamps. |
| `oauth_accounts` | Google subject to local user link. |
| `sessions` | Hashed session tokens and expiry. |
| `oauth_states` | Short-lived OAuth state, PKCE verifier and nonce. |
| `daily_puzzles` | One row per date with the answer snapshot. |
| `games` | Daily and practice games, server-owned state. |
| `guesses` | Every submitted guess with its comparison cells. |
| `daily_results` | Finished daily games. Stats derive from this table. |

The browser never receives the daily target before the game ends. It receives the
public building list and comparison results only.

## How the daily answer works

The game ships 823 buildings in `server/src/data/`. The English dataset is bundled
into the server only. Spanish display copy lives in `src/i18n/esData.ts`,
`src/i18n/esExtra.ts`, `src/i18n/esIcons.ts`, `src/i18n/esProposal.ts`,
`src/i18n/esLatam*.ts` and `src/i18n/esGlobal.ts`.

- `server/src/daily.ts` computes the day number from `DAILY_EPOCH`.
- The answer order is a deterministic shuffle seeded by `DAILY_SEED` and the cycle
  number. Each building appears once per cycle.
- `server/data/daily.json` can pin a building to a date. This overrides the
  deterministic choice. The file is validated at startup.
- The first request for a date writes a `daily_puzzles` row with the full answer
  snapshot. Later catalog or schedule changes do not rewrite that day's answer or
  its past comparisons.

Example schedule:

```json
{
  "2026-12-24": "cologne-cathedral",
  "2027-01-01": "sydney-opera-house"
}
```

Keys are dates in `PUZZLE_TIMEZONE`; values are building IDs from the dataset.

## Rules

Each guess compares these clues:

| Clue | Green | Yellow | Red |
| --- | --- | --- | --- |
| Continent | Same continent | — | Different continent |
| Country | Same country | — | Different country |
| Built | Same century | Neighbouring century | Further apart |
| Style | Same style | Same style family | Different family |
| Type | Same building type | Same form family | Different family |
| Use | Same use | — | Different use |
| Material | Same main material | Shared material or material family | No overlap |
| Architect | Same architect set | At least one shared architect | No overlap |

For **Built**, the tile shows the guessed year and century plus an arrow pointing to
the answer: `↓ older` or `↑ newer`. The first century BC and the first century AD are
treated as neighbouring centuries.

The final guess reveals its eight clue tiles one by one. The answer panel opens after
the row finishes, so the result is visible before the reveal.

If every clue is green but the guess is not the hidden building, the row is marked
**Close one!** and the game continues. This happens because the clue set can be
identical for different buildings.

Practice is unlimited, does not affect stats, and never picks today's daily answer.

## Stats

Stats derive from `daily_results`. Wins, win rate, current streak, maximum streak and
the guess distribution are computed from the user's finished daily games. Practice is
ignored. The guess distribution has one bucket per attempt, up to ten.

Progress from the old browser-only version is not imported. Migration
`003_drop_legacy_import.sql` removed the old imported stats.

## Analytics

The admin reports are first-party analytics. They are separate from Google Tag
Manager and GA4, which measure usage. Access requires either a signed-in Google
account listed in `ADMIN_EMAILS`, or `Authorization: Bearer $ADMIN_TOKEN`.

- `GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD` returns totals, daily rows,
  attempt distribution, top guessed buildings, top wrong guesses and signups by day.
- `GET /api/admin/reports/daily.csv` returns one row per daily puzzle.
- `GET /api/admin/reports/guesses.csv` returns building popularity and wrong-guess
  counts.
- `GET /api/admin/reports/attempts.csv` returns wins by attempt count per day.

SQL reports are in `server/sql/reports/`:

```sh
psql "$DATABASE_URL" -v from=2026-11-01 -v to=2026-11-30 \
  -f server/sql/reports/daily-summary.sql
```

The reports cover daily win rates, guess popularity, attempt distributions and
seven-day retention. No endpoint exposes emails, individual guesses, or a public
analytics page.

### GA4 events

The client pushes custom events to the GTM data layer with
`src/analytics.ts`. Tags and triggers for these events must be configured in the
GTM container. No typed text, email address, or other personal data is sent.

| Event | Key parameters |
| --- | --- |
| `guess_submit` | `mode`, `attempt`, `building_id` |
| `guess_result` | `mode`, `attempt`, `building_id`, `correct`, `near_miss`, `status` |
| `guess_error` | `mode`, `error_code` |
| `guess_submit_invalid` | `mode`, `reason` |
| `guess_type_start` | `mode` |
| `guess_type_clear` | `mode` |
| `guess_type_undo` | `mode` |
| `guess_select` | `mode`, `building_id`, `method` |
| `game_finish` | `mode`, `status`, `attempts` |
| `language_change` | `language` |
| `sign_in_click` | — |
| `account_menu_open` | — |
| `export_data_click` | — |
| `sign_out_click` | — |
| `delete_account_click` | — |
| `stats_open` | — |
| `help_open` | `source` |
| `mode_change` | `mode` |
| `new_practice_click` | `mode` |
| `new_daily_click` | — |
| `next_building_click` | `mode` |
| `play_practice_click` | `mode` |
| `share_click` | `mode` |
| `result_link_click` | `link`, `mode` |

`result_link_click` uses `link=wikipedia` or `link=commons`.

## API

All API responses are JSON. Errors look like:

```json
{ "error": { "code": "game_over", "message": "This game is already over." } }
```

### Public

- `GET /api/buildings` returns the autocomplete list: `id`, `name`, `hint`, `city`,
  `country`, `countryCode`, `architects`, and optional aliases. Architects are
  included so the client can search by architect. No comparison cells or answers
  are included.
- `GET /api/health` returns server status, building count and database status.
- `GET /robots.txt` and `GET /sitemap.xml`.
- `GET /legal/terms` and `GET /legal/privacy` serve the Spanish legal pages.
  `GET /legal/en/terms` and `GET /legal/en/privacy` serve the English versions.
  `/terms`, `/privacy`, `/en/terms` and `/en/privacy` redirect to them.

### Profile

- `GET /api/me` creates a guest session when needed and returns the profile, stats
  and whether Google sign-in is enabled.
- `GET /api/me/export` downloads the profile, games, guesses and daily results as
  JSON. Unfinished games leave out `target_building_id` and `target_snapshot`.
- `DELETE /api/me` deletes the profile and all related data.

### Games

- `GET /api/games/daily` returns the current daily game. It creates the daily puzzle
  snapshot and the user's game on first use.
- `GET /api/games/practice` returns the newest unfinished practice game, or creates
  one. Use `?new=1` for a new building and `&exclude=<id>` to avoid a repeat.
- `POST /api/games/:gameId/guess` with body `{ "buildingId": "colosseum" }`.

A game response contains `id`, `mode`, `status`, `maxGuesses`, `attempts`, submitted
`guesses` (building, cells, correct flag), daily metadata, and the `answer` only after
a win or loss.

### Authentication

- `GET /api/auth/google/start` starts the OAuth flow.
- `GET /api/auth/google/callback` completes it.
- `POST /api/auth/logout` deletes the current session.

### Admin

The analytics and CSV endpoints are listed above. They return `404` when no admin
access is configured, and `403` for a non-admin account.

The app does not rate limit requests. Use Cloudflare or the reverse proxy in front of
it.

## Photos

The reveal photo is fetched server-side from the English Wikipedia page media list.
The code skips logos, maps, diagrams and construction images, then asks Wikimedia
Commons for a 1400 px thumbnail and its attribution metadata. The photo, author,
license and Commons file link are shown in the reveal panel. Results are cached in
memory for 24 hours; if the lookup fails, the panel shows a drawn placeholder.

Photos require outbound access to `en.wikipedia.org`, `commons.wikimedia.org`,
`upload.wikimedia.org`, and `thumb.wikimedia.org` from the server. The rest of the
game works without network access.

## Project structure

```text
src/                    React client
  components/           header, account menu, board, input, reveal, modals
  i18n/                 English/Spanish UI strings and Spanish building copy
  api.ts                API client
  analytics.ts          GTM data-layer events
  search.ts             autocomplete search and scoring
  storage.ts            old key rename and intro flag
  share.ts              emoji result text and clipboard
server/src/             Express server
  data/                 building dataset (server-only)
  compare.ts            clue comparison rules
  daily.ts              deterministic daily selection and schedule
  puzzles.ts            daily puzzle snapshots and daily games
  games.ts              server-owned game state and guess submission
  users.ts              profiles, stats, export, delete
  oauth.ts              Google OAuth and account linking
  merge.ts              transactional guest merge
  admin.ts              private analytics, CSV and auth guard
  legal.ts              Terms of Service and Privacy Policy HTML
  session.ts            cookie sessions
  db.ts                 Postgres pool and transactions
  migrate.ts            SQL migration runner
  images.ts             Wikimedia photo lookup and attribution
  app.ts                routes and static file serving
server/sql/             migrations and SQL reports
shared/types.ts         types and constants shared by client and server
shared/stats.ts         stats helpers
tests/                  Vitest unit and database tests
server/data/            optional daily schedule
docs/                   catalog expansion proposals and research records
compose.yaml            development Postgres only
```

## Adding or editing a building

Buildings live in:

- `server/src/data/europe.ts`
- `server/src/data/americas.ts`
- `server/src/data/africa.ts`
- `server/src/data/asia.ts`
- `server/src/data/oceania.ts`
- `server/src/data/*-extra.ts`
- `server/src/data/proposal-*.ts`
- `server/src/data/latam-*.ts`
- `server/src/data/global-gaps.ts`
- `server/src/data/more.ts`

Spanish copy for the Latin America and global gap batches lives in
`src/i18n/esLatam.ts`, `src/i18n/esLatamMexico.ts`,
`src/i18n/esLatamCentral.ts`, `src/i18n/esLatamCaribbean.ts`,
`src/i18n/esLatamSouth.ts` and `src/i18n/esGlobal.ts`.

The 338 candidates from the catalog expansion proposal are now in
`server/src/data/proposal-*.ts`. The research record is in
`docs/building-catalog-proposal.md`, with a machine-readable version in
`docs/building-catalog-proposal.csv`.

Each entry implements `Building` in `server/src/types.ts`. Required fields include
the name, city, country and ISO code, continent, signed year (negative for BC),
style and style family, type and form family, use, materials (most important first),
architects, a short description, a fact, and an English Wikipedia title used for the
reveal photo. `aliases`, `yearNote`, and `heightM` are optional.

After a change:

```sh
npm run typecheck
npm test
```

The tests check unique IDs and names, valid enum values, known material names,
self-comparison, daily selection, date handling, snapshots, stats, account merges,
legal page rendering, the HTTP API, and complete English and Spanish
translation coverage.

Dates are completion, consecration, or opening dates, depending on the building.
Use `yearNote` when a single year needs context.

## Data sources

The catalog was assembled from public sources and checked building by building. It
is curated for global significance: the current set was compared with major landmark
lists and Wikipedia language coverage, low-visibility entries were removed, and the
most important missing landmarks were added. The main sources are:

- Wikidata (CC0) for structured candidates and identifiers
- Wikipedia and Wikimedia Commons for article titles, history and photos
- UNESCO World Heritage List for global and underrepresented sites
- National heritage registers, including English, French, Spanish, Italian, US,
  Canadian, Australian and New Zealand lists
- Aga Khan Award for Architecture and Docomomo for modern and non-Western work

Facts are written in our own words. Photos are fetched from Wikimedia and credited
at reveal time. Before adding a building, verify its date, country, style, type,
materials and architect against an official or heritage source.

The 2026 expansion added 338 buildings from `docs/building-catalog-proposal.md`.
The new entries live in `server/src/data/proposal-*.ts` and their Spanish copy in
`src/i18n/esProposal.ts`.

A later November 2026 expansion added 225 buildings: 155 in Latin America and the
Caribbean, plus 70 global gap-fillers. The research record is in
`docs/latin-america-expansion.md`, with a machine-readable version in
`docs/latin-america-expansion.csv`. The new entries live in
`server/src/data/latam-*.ts` and `server/src/data/global-gaps.ts`.

## SEO and metadata

Set `SITE_URL` before a production build. It fills the canonical URL, Open Graph and
Twitter image URLs, OAuth defaults, and the JSON-LD site URL.

The default static shell is Spanish. The server localizes it when the request has
`?lang=en`, or when `Accept-Language` prefers English over Spanish:

- title, description, canonical URL, Open Graph, Twitter card and JSON-LD
- the social image: `og-image.png` for Spanish and `og-image-en.png` for English
- the HTML fallback shown before React loads

The page sends `Vary: Accept-Language` and `Cache-Control: no-cache` for the HTML
shell. Make sure the CDN forwards query strings and respects revalidation for `/`.

The Terms of Service and Privacy Policy are standalone HTML, generated by
`server/src/legal.ts`. They use fixed language paths, so they do not need
`Vary`. In production they send `Cache-Control: public, max-age=2592000`, and
CloudFront caches `/legal/*` for 30 days. In development they send `no-cache`.
Invalidate `/legal/*` after you change the copy. The footer links to the page
that matches the selected language.

The build includes:

- a descriptive title, meta description, keywords, robots meta, canonical link and
  English/Spanish `hreflang` alternates
- Open Graph and Twitter card metadata with a 1200 × 630 social image per language
- JSON-LD for `WebSite` and `WebApplication`
- a web app manifest and 192/512 px icons
- a static HTML fallback with a readable heading and description for crawlers
- `/robots.txt` and `/sitemap.xml`, generated from `SITE_URL` or the request origin

The social images are rendered from `scripts/og-image.html`. Open the file with
`?lang=es` or `?lang=en` in a headless browser and capture a 1200 × 630 screenshot
after the fonts load. Replace `public/og-image.png` and `public/og-image-en.png`
with the results.

The server sets `trust proxy` so the request protocol is correct behind a reverse
proxy.

## Tests

```sh
npm run typecheck
npm test
```

Without `TEST_DATABASE_URL`, the database suite is skipped and the pure unit tests
still run. To run everything, point it at a disposable database whose name ends in
`_test`:

```sh
TEST_DATABASE_URL=postgres://arqdle:arqdle_dev_password@localhost:5432/arqdle_test \
  npm test
```

The test runner refuses a `TEST_DATABASE_URL` that does not end in `_test`, then
recreates the schema before the database suite.

## Privacy and data retention

The public policy is at <https://arqdle.com/legal/privacy> (Spanish) and
<https://arqdle.com/legal/en/privacy> (English). Update `server/src/legal.ts`
when data handling changes.

- Guests are anonymous database rows. The app database does not store IP addresses
  or user-agent strings. Google Tag Manager and GA4 run in the browser and send
  usage data to Google.
- Session tokens are stored as hashes. The cookie is HttpOnly and Secure in
  production.
- Google sign-in stores the Google subject, email, name, picture URL and locale. It
  does not store access or refresh tokens.
- Guesses and daily results are stored to produce stats and aggregate analytics.
- Players can export or delete their data from the account menu.
- Only aggregate analytics are available, and only to configured admins.
- `npm run db:cleanup-guests` removes guest profiles older than
  `GUEST_RETENTION_DAYS` that have no games or results.

The production client injects Google Tag Manager container `GTM-WR9Z3FTC`. Its
current GA4 tag uses measurement ID `G-LMKYBP3V0R`. GTM is not loaded in
development or on the static legal pages. Update `server/src/legal.ts` when tags
or purposes change.

## Credits

Developed for Kimberly Salvo, with love, by [Felipe Lecot](https://www.felipelecot.com).

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
