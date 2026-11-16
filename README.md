# Archdle

A Wordle-style daily architecture guessing game. Type a building name, pick it from
the autocomplete list, and compare eight clues against the hidden building. Green is
an exact match, yellow is close, and red is a miss. You get six guesses.

The interface and building copy are available in English and Spanish. Use the
`ES` / `EN` button in the header, or open `?lang=es`.

After a daily game ends, a countdown shows the time until the next daily building.

The daily answer stays on the server. The browser receives the public autocomplete
list and comparison results until a game ends. The Spanish display copy is bundled
in the client so language changes apply instantly, including to saved games.

## Run it locally

Requires Node 22.12 or newer.

```sh
npm install
cp .env.example .env
# Put a random value in PUZZLE_SECRET. For example:
# openssl rand -hex 32
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies API requests to the
Express server (port 3001 by default).

For an unlimited development game, switch to the **Practice** tab, or open
<http://localhost:5173/?mode=practice>. Add `&lang=es` for Spanish.

## Production

```sh
npm ci
npm run build
cp .env.example .env
# Set a stable random PUZZLE_SECRET in .env (openssl rand -hex 32).
npm start
```

`npm start` sets `NODE_ENV=production`. The Express server serves the built client
from `dist/client` and the API from the same origin, so one process is enough.

A `.env` file is loaded automatically. Do not commit it. Keep the same
`PUZZLE_SECRET` across restarts and instances, or saved puzzle tokens will become
invalid.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port for the API and the production site. |
| `PUZZLE_SECRET` | Random in production | Encrypts puzzle tokens. Use a long random value and keep it stable. Changing it invalidates saved games. |
| `PUZZLE_TIMEZONE` | `America/Montevideo` | Time zone used to decide when the daily puzzle changes. |
| `DAILY_EPOCH` | `2026-11-16` | Day 1 of the daily sequence. |
| `DAILY_SEED` | `archdle-2026` | Seed for the deterministic daily order. |
| `DAILY_SCHEDULE` | `server/data/daily.json` | Optional JSON file that pins answers to dates. |
| `WIKIMEDIA_USER_AGENT` | `Archdle/1.0 (self-hosted architecture guessing game)` | Descriptive User-Agent for Wikimedia image requests. Add a contact URL or email for a public deployment. |

In production, a missing `PUZZLE_SECRET` makes the server generate a temporary
secret and print a warning. Saved games will stop working after a restart, so set a
stable secret. A supplied secret shorter than 24 characters is rejected in
production.

## How the daily answer works

The game ships 72 buildings in `server/src/data/`. The English dataset is bundled
into the server only. Spanish display copy for the same buildings lives in
`src/i18n/esData.ts` so the language toggle can update saved games immediately.

- `server/src/daily.ts` computes the day number from `DAILY_EPOCH`.
- The answer order is a deterministic shuffle seeded by `DAILY_SEED` and the cycle
  number. Each building appears once per cycle.
- `server/data/daily.json` can pin a building to a date. This overrides the
  deterministic choice. The file is validated at startup.

Example:

```json
{
  "2026-12-24": "cologne-cathedral",
  "2027-01-01": "sydney-opera-house"
}
```

Keys are dates in `PUZZLE_TIMEZONE`; values are building IDs from the dataset.
Restart the server after editing the schedule.

Each puzzle gets an AES-256-GCM encrypted token containing the target building ID
and the number of guesses used. The client cannot read the target or forge a token.
The API returns `answer` data only after a win or after the sixth wrong guess.

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

Practice is unlimited, does not affect stats, and never picks today's daily answer.

## Adding or editing a building

Buildings live in:

- `server/src/data/europe.ts`
- `server/src/data/americas.ts`
- `server/src/data/africa.ts`
- `server/src/data/asia.ts`
- `server/src/data/oceania.ts`

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
self-comparison (every building must be all green against itself), daily selection,
the next-midnight calculation, token validation, the HTTP API, and complete English
and Spanish translation coverage.

Dates are completion, consecration, or opening dates, depending on the building.
Use `yearNote` when a single year needs context (for example, a rebuilt pavilion or
a cathedral finished centuries after it began).

## API

All responses are JSON. Errors look like:

```json
{ "error": { "code": "invalid_token", "message": "This game session is no longer valid. Start a new game." } }
```

### `GET /api/buildings`

Returns the public autocomplete list: `id`, `name`, `hint` (city and country),
`city`, `country`, `countryCode`, and optional aliases. It does not include the full
attributes.

### `GET /api/puzzle?mode=daily|practice&exclude=<id>`

Starts a game and returns `token`, `mode`, `maxGuesses`, and for daily games
`date`, `dateLabel`, `nextDailyAt`, and `dayNumber`. The target is not included.
`exclude` is optional for practice and avoids repeating the previous answer.

### `POST /api/guess`

Body:

```json
{ "token": "…", "guessId": "colosseum" }
```

Returns the guess, eight cells with `status`, display values and an accessible note,
the new token, attempts, status (`playing`, `won`, or `lost`), and the answer on a
win or loss.

### `GET /api/health`

Returns the server status and building count.

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
src/                 React client
  components/        header, board, input, reveal, modals, countdown
  i18n/              English/Spanish UI strings and Spanish building copy
  api.ts             API client
  storage.ts         local daily/practice state and stats
  share.ts           emoji result text and clipboard
server/src/          Express server
  data/              building dataset (server-only)
  compare.ts         clue comparison rules
  daily.ts           deterministic daily selection and schedule
  puzzle.ts          encrypted puzzle tokens and guess resolution
  images.ts          Wikimedia photo lookup and attribution
  app.ts             routes and static file serving
shared/types.ts      types and constants shared by client and server
shared/stats.ts      pure daily stats update logic
tests/               Vitest unit and API tests
server/data/         optional daily schedule
```

## Notes

- No accounts and no database. Daily and practice progress, plus stats, are stored
  in the browser's `localStorage`.
- Stats count daily games only. Practice results are ignored.
- The daily generation and tokens are stateless, so multiple server instances work
  if they share the same `PUZZLE_SECRET`, `DAILY_SEED`, `DAILY_EPOCH`, and daily
  schedule.
- The game is casual: clearing browser storage or requesting a new daily token can
  reset a local game. The server still never sends the answer before it is earned.
- For a public deployment, run behind HTTPS and a reverse proxy, set a stable
  `PUZZLE_SECRET`, and configure the desired `PUZZLE_TIMEZONE`.

## Reset a local daily game

Open `/?reset=daily` to remove the saved daily game from this browser. The page then
starts a fresh daily game. Stats are kept, and the daily answer is unchanged.

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
