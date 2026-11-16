import { once } from 'node:events';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../server/src/app';
import { buildings } from '../server/src/data';
import { todayDailySelection } from '../server/src/daily';
import type { GuessResponse, PuzzleStart } from '../shared/types';

let server: Server;
let baseUrl: string;

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  return (await response.json()) as T;
}

beforeAll(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server address');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('API', () => {
  it('reports health and the building list', async () => {
    const health = await json<{ ok: boolean; buildings: number }>('/api/health');
    expect(health.ok).toBe(true);
    expect(health.buildings).toBe(buildings.length);

    const options = await json<
      Array<{ id: string; name: string; hint: string; city: string; country: string; countryCode: string }>
    >('/api/buildings');
    expect(options).toHaveLength(buildings.length);
    expect(options[0].name.length).toBeGreaterThan(0);
    expect(options[0].hint.length).toBeGreaterThan(0);
    expect(options[0].city.length).toBeGreaterThan(0);
    expect(options[0].country.length).toBeGreaterThan(0);
    expect(options[0].countryCode).toMatch(/^[A-Z]{2}$/);
  });

  it('starts the daily puzzle without sending an answer', async () => {
    const puzzle = await json<PuzzleStart>('/api/puzzle?mode=daily');
    expect(puzzle.token.length).toBeGreaterThan(20);
    expect(puzzle.mode).toBe('daily');
    expect(puzzle.dayNumber).toBeGreaterThan(0);
    expect(puzzle).not.toHaveProperty('answer');
    expect(puzzle).not.toHaveProperty('building');
  });

  it('compares a wrong guess and returns a fresh token', async () => {
    const puzzle = await json<PuzzleStart>('/api/puzzle?mode=daily');
    const targetId = todayDailySelection().building.id;
    const wrong = buildings.find((building) => building.id !== targetId);
    expect(wrong).toBeDefined();
    if (!wrong) return;

    const result = await json<GuessResponse>('/api/guess', {
      method: 'POST',
      body: JSON.stringify({ token: puzzle.token, guessId: wrong.id }),
    });
    expect(result.status).toBe('playing');
    expect(result.guess.id).toBe(wrong.id);
    expect(result.cells).toHaveLength(8);
    expect(result.token).toBeTruthy();
    expect(result.answer).toBeUndefined();
  });

  it('rejects an invalid mode and a malformed guess', async () => {
    const modeResponse = await fetch(`${baseUrl}/api/puzzle?mode=wrong`);
    expect(modeResponse.status).toBe(400);
    const modeBody = (await modeResponse.json()) as { error: { code: string } };
    expect(modeBody.error.code).toBe('invalid_mode');

    const guessResponse = await fetch(`${baseUrl}/api/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(guessResponse.status).toBe(400);
    const guessBody = (await guessResponse.json()) as { error: { code: string } };
    expect(guessBody.error.code).toBe('invalid_request');
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('not_found');
  });

  it('serves robots.txt and sitemap.xml', async () => {
    const robots = await fetch(`${baseUrl}/robots.txt`);
    expect(robots.status).toBe(200);
    expect(robots.headers.get('content-type')).toContain('text/plain');
    const robotsText = await robots.text();
    expect(robotsText).toContain('Sitemap: http://127.0.0.1');
    expect(robotsText).toContain('Disallow: /api/');

    const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
    expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get('content-type')).toContain('application/xml');
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).toContain('http://127.0.0.1');
  });
});
