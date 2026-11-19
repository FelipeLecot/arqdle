import crypto from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MAX_GUESSES, type GameView, type Me, type Stats } from '../shared/types';

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);
const describeDatabase = hasDatabase ? describe : describe.skip;

let server: Server;
let baseUrl: string;
let db: typeof import('../server/src/db');
let daily: typeof import('../server/src/daily');
let data: typeof import('../server/src/data');
let oauth: typeof import('../server/src/oauth');

interface JsonError {
  error: { code: string; message: string };
}

class TestClient {
  cookie: string | null = null;
  async request(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (this.cookie) headers.set('cookie', this.cookie);
    if (init?.body && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const cookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];
    for (const raw of cookies) {
      const pair = raw.split(';')[0];
      const index = pair.indexOf('=');
      if (index === -1) continue;
      const name = pair.slice(0, index);
      if (name !== 'arqdle_session') continue;
      const value = pair.slice(index + 1);
      this.cookie = value ? `${name}=${value}` : null;
    }
    return response;
  }

  async json<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(path, init);
    const text = await response.text();
    const body = text ? (JSON.parse(text) as unknown) : null;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
    return body as T;
  }

  guess(gameId: string, buildingId: string): Promise<GameView> {
    return this.json<GameView>(`/api/games/${gameId}/guess`, {
      method: 'POST',
      body: JSON.stringify({ buildingId }),
    });
  }
}

async function me(client: TestClient): Promise<Me> {
  return client.json<Me>('/api/me');
}

function wrongBuildings(targetId: string, count: number): string[] {
  return data.buildings
    .filter((building) => building.id !== targetId)
    .slice(0, count)
    .map((building) => building.id);
}

async function loseDaily(client: TestClient): Promise<GameView> {
  const target = daily.todayDailySelection();
  const game = await client.json<GameView>('/api/games/daily');
  let current = game;
  for (const id of wrongBuildings(target.building.id, MAX_GUESSES)) {
    current = await client.guess(game.id, id);
  }
  return current;
}

async function winDaily(client: TestClient, withWrongGuess = false): Promise<GameView> {
  const target = daily.todayDailySelection();
  const game = await client.json<GameView>('/api/games/daily');
  if (withWrongGuess) {
    const [wrong] = wrongBuildings(target.building.id, 1);
    await client.guess(game.id, wrong);
  }
  return client.guess(game.id, target.building.id);
}

describeDatabase('database-backed API', () => {
  beforeAll(async () => {
    db = await import('../server/src/db');
    const { runMigrations } = await import('../server/src/migrate');
    await db.pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await runMigrations();

    daily = await import('../server/src/daily');
    data = await import('../server/src/data');
    oauth = await import('../server/src/oauth');
    const { app } = await import('../server/src/app');

    server = app.listen(0);
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No test server address');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(async () => {
    await db.pool.query(
      'TRUNCATE users, daily_puzzles, oauth_states RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await db.closeDatabase();
  });

  it('creates a guest profile and serves the daily game', async () => {
    const client = new TestClient();
    const profile = await me(client);
    expect(profile.profile.kind).toBe('guest');
    expect(profile.profile.stats.played).toBe(0);
    expect(profile.canImportLegacy).toBe(true);
    expect(profile.auth.googleEnabled).toBe(false);

    const game = await client.json<GameView>('/api/games/daily');
    expect(game.mode).toBe('daily');
    expect(game.status).toBe('playing');
    expect(game.date).toBe(daily.todayDateKey());
    expect(game.guesses).toHaveLength(0);
    expect(game.answer).toBeUndefined();
  });

  it('stores guesses, is idempotent, and updates stats on a win', async () => {
    const client = new TestClient();
    const target = daily.todayDailySelection();
    const game = await client.json<GameView>('/api/games/daily');
    const [wrong] = wrongBuildings(target.building.id, 1);

    const first = await client.guess(game.id, wrong);
    expect(first.status).toBe('playing');
    expect(first.guesses).toHaveLength(1);
    expect(first.answer).toBeUndefined();

    const duplicate = await client.guess(game.id, wrong);
    expect(duplicate.guesses).toHaveLength(1);
    const count = await db.pool.query<{ count: string }>(
      'SELECT count(*) FROM guesses WHERE game_id = $1',
      [game.id],
    );
    expect(Number(count.rows[0].count)).toBe(1);

    const won = await client.guess(game.id, target.building.id);
    expect(won.status).toBe('won');
    expect(won.attempts).toBe(2);
    expect(won.answer?.id).toBe(target.building.id);
    expect(won.guesses).toHaveLength(2);
    expect(won.guesses[1].cells.every((cell) => cell.status === 'green')).toBe(true);

    const profile = await me(client);
    expect(profile.profile.stats.played).toBe(1);
    expect(profile.profile.stats.wins).toBe(1);
    expect(profile.profile.stats.currentStreak).toBe(1);
    expect(profile.profile.stats.distribution).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0, 0]);

    const reloaded = await client.json<GameView>('/api/games/daily');
    expect(reloaded.id).toBe(game.id);
    expect(reloaded.status).toBe('won');
    expect(reloaded.guesses).toHaveLength(2);
  });

  it('loses after ten wrong guesses and records the result', async () => {
    const client = new TestClient();
    const target = daily.todayDailySelection();
    const result = await loseDaily(client);
    expect(result.status).toBe('lost');
    expect(result.attempts).toBe(MAX_GUESSES);
    expect(result.answer?.id).toBe(target.building.id);

    const profile = await me(client);
    expect(profile.profile.stats.played).toBe(1);
    expect(profile.profile.stats.wins).toBe(0);
    expect(profile.profile.stats.currentStreak).toBe(0);
  });

  it('persists practice games without affecting stats', async () => {
    const client = new TestClient();
    const first = await client.json<GameView>('/api/games/practice');
    expect(first.mode).toBe('practice');
    expect(first.status).toBe('playing');

    const again = await client.json<GameView>('/api/games/practice');
    expect(again.id).toBe(first.id);

    const fresh = await client.json<GameView>('/api/games/practice?new=1');
    expect(fresh.id).not.toBe(first.id);

    const targetRow = await db.pool.query<{ target_building_id: string }>(
      'SELECT target_building_id FROM games WHERE id = $1',
      [fresh.id],
    );
    const [wrong] = wrongBuildings(targetRow.rows[0].target_building_id, 1);
    const guessed = await client.guess(fresh.id, wrong);
    expect(guessed.attempts).toBe(1);
    expect(guessed.status).toBe('playing');

    const profile = await me(client);
    expect(profile.profile.stats.played).toBe(0);
  });

  it('imports legacy stats and the current daily game once', async () => {
    const client = new TestClient();
    const target = daily.todayDailySelection();
    const day = target.dayNumber;
    const [wrong] = wrongBuildings(target.building.id, 1);
    const legacy: Stats = {
      played: 4,
      wins: 3,
      currentStreak: 2,
      maxStreak: 2,
      lastDay: day > 1 ? day - 1 : null,
      distribution: [1, 1, 1, 0, 0, 0],
    };

    const imported = await client.json<Me>('/api/me/import', {
      method: 'POST',
      body: JSON.stringify({
        stats: legacy,
        daily: {
          date: daily.todayDateKey(),
          guesses: [{ id: wrong }, { id: target.building.id }],
        },
      }),
    });

    expect(imported.canImportLegacy).toBe(false);
    expect(imported.profile.stats.played).toBe(5);
    expect(imported.profile.stats.wins).toBe(4);
    expect(imported.profile.stats.currentStreak).toBe(day > 1 ? 3 : 1);
    expect(imported.profile.stats.distribution).toEqual([1, 2, 1, 0, 0, 0, 0, 0, 0, 0]);

    const game = await client.json<GameView>('/api/games/daily');
    expect(game.status).toBe('won');
    expect(game.attempts).toBe(2);

    const second = await client.json<Me>('/api/me/import', {
      method: 'POST',
      body: JSON.stringify({
        stats: { ...legacy, played: 999, wins: 999, distribution: [0, 0, 0, 0, 0, 6] },
      }),
    });
    expect(second.profile.stats.played).toBe(5);
    expect(second.profile.stats.wins).toBe(4);
  });

  it('merges a guest win into an existing Google account', async () => {
    const identity = {
      sub: 'google-sub-1',
      email: 'player@example.com',
      emailVerified: true,
      name: 'Player One',
    };

    const first = new TestClient();
    const firstProfile = await me(first);
    const lost = await loseDaily(first);
    expect(lost.status).toBe('lost');
    await oauth.signInWithGoogleIdentity(identity, firstProfile.profile.id);

    const second = new TestClient();
    const secondProfile = await me(second);
    const won = await winDaily(second, false);
    expect(won.status).toBe('won');

    await oauth.signInWithGoogleIdentity(identity, secondProfile.profile.id);

    const merged = await me(first);
    expect(merged.profile.kind).toBe('google');
    expect(merged.profile.email).toBe(identity.email);
    expect(merged.profile.stats.played).toBe(1);
    expect(merged.profile.stats.wins).toBe(1);
    expect(merged.profile.stats.distribution).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const game = await first.json<GameView>('/api/games/daily');
    expect(game.status).toBe('won');
    expect(game.attempts).toBe(1);

    const users = await db.pool.query<{ count: string }>('SELECT count(*) FROM users');
    expect(Number(users.rows[0].count)).toBe(1);
  });

  it('keeps the fewer-attempt win during a merge', async () => {
    const identity = {
      sub: 'google-sub-2',
      email: 'player2@example.com',
      emailVerified: true,
    };

    const first = new TestClient();
    const firstProfile = await me(first);
    await winDaily(first, true); // two attempts
    await oauth.signInWithGoogleIdentity(identity, firstProfile.profile.id);

    const second = new TestClient();
    const secondProfile = await me(second);
    await winDaily(second, false); // one attempt

    await oauth.signInWithGoogleIdentity(identity, secondProfile.profile.id);

    const merged = await me(first);
    expect(merged.profile.stats.distribution).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const game = await first.json<GameView>('/api/games/daily');
    expect(game.attempts).toBe(1);
  });

  it('exports and deletes an account', async () => {
    const client = new TestClient();
    const profile = await me(client);
    await winDaily(client);

    const exported = await client.json<{
      profile: { id: string };
      games: unknown[];
      dailyResults: unknown[];
    }>('/api/me/export');
    expect(exported.profile.id).toBe(profile.profile.id);
    expect(exported.games).toHaveLength(1);
    expect(exported.dailyResults).toHaveLength(1);

    await client.json<{ ok: boolean }>('/api/me', { method: 'DELETE' });
    const next = await me(client);
    expect(next.profile.id).not.toBe(profile.profile.id);

    const old = await db.pool.query<{ count: string }>(
      'SELECT count(*) FROM users WHERE id = $1',
      [profile.profile.id],
    );
    expect(Number(old.rows[0].count)).toBe(0);
  });

  it('protects admin analytics and CSV reports', async () => {
    const client = new TestClient();
    await winDaily(client);

    const denied = await client.request('/api/admin/analytics');
    expect(denied.status).toBe(403);

    const headers = { Authorization: 'Bearer test-admin-token-1234' };
    const analytics = await client.json<{
      totals: { completedDailyGames: number; wins: number };
      days: Array<{ players: number }>;
    }>('/api/admin/analytics', { headers });
    expect(analytics.totals.completedDailyGames).toBe(1);
    expect(analytics.totals.wins).toBe(1);
    expect(analytics.days).toHaveLength(1);
    expect(analytics.days[0].players).toBe(1);

    const csv = await client.request('/api/admin/reports/daily.csv', { headers });
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(await csv.text()).toContain('date,day_number,target_id,target_name');

    const wrong = await client.request('/api/admin/analytics', {
      headers: { Authorization: 'Bearer wrong-token' },
    });
    expect(wrong.status).toBe(403);
  });

  it('validates game and guess identifiers', async () => {
    const client = new TestClient();
    await me(client);

    const invalidGame = await client.request('/api/games/not-a-uuid/guess', {
      method: 'POST',
      body: JSON.stringify({ buildingId: data.buildings[0].id }),
    });
    expect(invalidGame.status).toBe(400);
    expect(((await invalidGame.json()) as JsonError).error.code).toBe('invalid_game');

    const invalidGuess = await client.request(
      `/api/games/${crypto.randomUUID()}/guess`,
      {
        method: 'POST',
        body: JSON.stringify({ buildingId: 'not-a-building' }),
      },
    );
    expect(invalidGuess.status).toBe(400);
    expect(((await invalidGuess.json()) as JsonError).error.code).toBe('invalid_guess');

    const invalidBody = await client.request('/api/games/not-a-uuid/guess', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(invalidBody.status).toBe(400);
    expect(((await invalidBody.json()) as JsonError).error.code).toBe('invalid_request');
  });

  it('reports health and serves robots.txt and sitemap.xml', async () => {
    const client = new TestClient();
    const health = await client.json<{ ok: boolean; db: boolean; buildings: number }>(
      '/api/health',
    );
    expect(health.ok).toBe(true);
    expect(health.db).toBe(true);
    expect(health.buildings).toBe(data.buildings.length);

    const robots = await client.request('/robots.txt');
    expect(robots.status).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).toContain('Disallow: /api/');
    expect(robotsText).toContain('Sitemap: http://127.0.0.1');

    const sitemap = await client.request('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).toContain('/legal/terms');
    expect(sitemapText).toContain('/legal/en/privacy');

    const terms = await client.request('/legal/terms');
    expect(terms.status).toBe(200);
    expect(terms.headers.get('cache-control')).toBe(
      process.env.NODE_ENV === 'production' ? 'public, max-age=2592000' : 'no-cache',
    );
    expect(terms.headers.get('content-language')).toBe('es');
    expect(await terms.text()).toContain('Términos del servicio');

    const privacyEn = await client.request('/legal/en/privacy');
    expect(privacyEn.status).toBe(200);
    expect(privacyEn.headers.get('content-language')).toBe('en');
    expect(await privacyEn.text()).toContain('Privacy Policy');

    const redirect = await client.request('/terms', { redirect: 'manual' });
    expect(redirect.status).toBe(301);
    expect(redirect.headers.get('location')).toBe('/legal/terms');
  });

  it('disables Google sign-in when credentials are missing', async () => {
    const client = new TestClient();
    await me(client);
    const response = await client.request('/api/auth/google/start');
    expect(response.status).toBe(503);
    const body = (await response.json()) as JsonError;
    expect(body.error.code).toBe('google_not_configured');
  });
});
