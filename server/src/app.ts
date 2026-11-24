import express, { type ErrorRequestHandler } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { BuildingOption } from '../../shared/types';
import {
  attemptsCsv,
  dailyCsv,
  getAnalytics,
  guessesCsv,
  parseDateRange,
  requireAdmin,
} from './admin';
import { config } from './config';
import { buildings } from './data';
import { checkDatabase, isDatabaseUnavailable } from './db';
import { ApiError } from './errors';
import { getDailyGame, getPracticeGame, submitGuess } from './games';
import { localizeHtml, resolveHtmlLang } from './html';
import { requestOrigin, sameOriginOnly } from './http';
import {
  LEGAL_CACHE_CONTROL,
  LEGAL_LAST_UPDATED,
  LEGAL_ROUTES,
  legalPath,
  renderLegalPage,
} from './legal';
import {
  buildGoogleAuthorizationUrl,
  consumeOAuthState,
  createOAuthState,
  exchangeGoogleCode,
  isGoogleConfigured,
  safeRedirect,
  signInWithGoogleIdentity,
} from './oauth';
import {
  attachSession,
  clearSessionCookie,
  deleteSessionByToken,
  ensureUser,
  rotateSessionForUser,
} from './session';
import { buildMe, deleteUser, exportUserData } from './users';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', async (_req, res) => {
  const db = await checkDatabase();
  res.status(db ? 200 : 503).json({
    ok: db,
    buildings: buildings.length,
    db,
  });
});

function withAuthResult(target: string, result: 'ok' | 'error'): string {
  const url = new URL(safeRedirect(target), 'http://arqdle.local');
  url.searchParams.set('auth', result);
  return `${url.pathname}${url.search}${url.hash}`;
}

app.use('/api', sameOriginOnly);
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api', attachSession);

app.get('/api/buildings', (_req, res) => {
  const options: BuildingOption[] = buildings.map((building) => ({
    id: building.id,
    name: building.name,
    hint:
      building.city === building.country
        ? building.city
        : `${building.city}, ${building.country}`,
    city: building.city,
    country: building.country,
    countryCode: building.countryCode,
    aliases: building.aliases,
  }));
  res.json(options);
});

app.get('/api/me', ensureUser, async (req, res) => {
  res.json(await buildMe(req.user!));
});

app.get('/api/me/export', ensureUser, async (req, res) => {
  const data = await exportUserData(req.user!);
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="arqdle-export-${stamp}.json"`,
  );
  res.json(data);
});

app.delete('/api/me', ensureUser, async (req, res) => {
  await deleteUser(req.user!.id);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post('/api/auth/logout', async (req, res) => {
  if (req.sessionToken) await deleteSessionByToken(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/google/start', ensureUser, async (req, res) => {
  if (!isGoogleConfigured()) {
    throw new ApiError(
      503,
      'google_not_configured',
      'Google sign-in is not configured on this server.',
    );
  }
  const { state, codeChallenge, nonce } = await createOAuthState(
    req.user!.id,
    typeof req.query.next === 'string' ? req.query.next : '/',
  );
  res.redirect(302, buildGoogleAuthorizationUrl(state, codeChallenge, nonce));
});

app.get('/api/auth/google/callback', async (req, res) => {
  if (!isGoogleConfigured()) {
    throw new ApiError(
      503,
      'google_not_configured',
      'Google sign-in is not configured on this server.',
    );
  }

  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!state || !code) {
    res.redirect('/?auth=error&reason=missing');
    return;
  }

  let stored;
  try {
    stored = await consumeOAuthState(state);
  } catch (error) {
    console.error('[auth] could not read state', (error as Error).message);
    res.redirect('/?auth=error&reason=state');
    return;
  }
  if (!stored) {
    res.redirect('/?auth=error&reason=state');
    return;
  }

  try {
    const identity = await exchangeGoogleCode(code, stored.code_verifier, stored.nonce);
    const user = await signInWithGoogleIdentity(identity, stored.user_id);
    if (req.sessionToken) await deleteSessionByToken(req.sessionToken);
    await rotateSessionForUser(res, user.id);
    res.redirect(withAuthResult(stored.redirect_to ?? '/', 'ok'));
  } catch (error) {
    console.error(
      '[auth] Google sign-in failed',
      error instanceof Error ? error.message : error,
    );
    res.redirect(withAuthResult(stored.redirect_to ?? '/', 'error'));
  }
});

app.get('/api/games/daily', ensureUser, async (req, res) => {
  res.json(await getDailyGame(req.user!.id));
});

app.get('/api/games/practice', ensureUser, async (req, res) => {
  const newGame = req.query.new === '1' || req.query.new === 'true';
  const excludeId = typeof req.query.exclude === 'string' ? req.query.exclude : undefined;
  res.json(await getPracticeGame(req.user!.id, { newGame, excludeId }));
});

app.post('/api/games/:gameId/guess', ensureUser, async (req, res) => {
  const body = req.body as { buildingId?: unknown } | null;
  if (!body || typeof body.buildingId !== 'string' || body.buildingId.length > 120) {
    throw new ApiError(400, 'invalid_request', 'A building id is required.');
  }
  const gameId = Array.isArray(req.params.gameId)
    ? req.params.gameId[0]
    : req.params.gameId;
  res.json(await submitGuess(req.user!.id, gameId, body.buildingId));
});

app.use('/api/admin', requireAdmin);

app.get('/api/admin/analytics', async (req, res) => {
  const range = parseDateRange(req.query.from, req.query.to);
  res.json(await getAnalytics(range));
});

app.get('/api/admin/reports/daily.csv', async (req, res) => {
  const range = parseDateRange(req.query.from, req.query.to);
  const analytics = await getAnalytics(range);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="arqdle-daily-${range.from}-${range.to}.csv"`,
  );
  res.type('text/csv; charset=utf-8').send(dailyCsv(analytics));
});

app.get('/api/admin/reports/guesses.csv', async (req, res) => {
  const range = parseDateRange(req.query.from, req.query.to);
  const analytics = await getAnalytics(range);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="arqdle-guesses-${range.from}-${range.to}.csv"`,
  );
  res.type('text/csv; charset=utf-8').send(guessesCsv(analytics));
});

app.get('/api/admin/reports/attempts.csv', async (req, res) => {
  const range = parseDateRange(req.query.from, req.query.to);
  const analytics = await getAnalytics(range);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="arqdle-attempts-${range.from}-${range.to}.csv"`,
  );
  res.type('text/csv; charset=utf-8').send(attemptsCsv(analytics));
});

app.get('/legal', (_req, res) => {
  res.redirect(301, legalPath('terms', 'es'));
});

app.get('/terms', (_req, res) => {
  res.redirect(301, legalPath('terms', 'es'));
});

app.get('/privacy', (_req, res) => {
  res.redirect(301, legalPath('privacy', 'es'));
});

app.get('/en/terms', (_req, res) => {
  res.redirect(301, legalPath('terms', 'en'));
});

app.get('/en/privacy', (_req, res) => {
  res.redirect(301, legalPath('privacy', 'en'));
});

for (const route of LEGAL_ROUTES) {
  app.get(route.path, (req, res) => {
    // Only the production CDN should keep these for 30 days. In development a
    // long browser cache would hide edits.
    res.setHeader('Cache-Control', config.isProduction ? LEGAL_CACHE_CONTROL : 'no-cache');
    res.setHeader('Content-Language', route.lang);
    res.type('html').send(renderLegalPage(route.page, route.lang, requestOrigin(req)));
  });
}

app.get('/robots.txt', (req, res) => {
  const origin = requestOrigin(req);
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
});

app.get('/sitemap.xml', (req, res) => {
  const origin = requestOrigin(req);
  const lastmod = new Date().toISOString().slice(0, 10);
  const legalEntries = (['terms', 'privacy'] as const)
    .map((page) => {
      const es = `${origin}${legalPath(page, 'es')}`;
      const en = `${origin}${legalPath(page, 'en')}`;
      const alternates =
        `    <xhtml:link rel="alternate" hreflang="es" href="${es}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${en}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${es}" />\n`;
      return (
        `  <url>\n` +
        `    <loc>${es}</loc>\n` +
        `    <lastmod>${LEGAL_LAST_UPDATED}</lastmod>\n` +
        `    <changefreq>yearly</changefreq>\n` +
        `    <priority>0.3</priority>\n` +
        alternates +
        `  </url>\n` +
        `  <url>\n` +
        `    <loc>${en}</loc>\n` +
        `    <lastmod>${LEGAL_LAST_UPDATED}</lastmod>\n` +
        `    <changefreq>yearly</changefreq>\n` +
        `    <priority>0.3</priority>\n` +
        alternates +
        `  </url>\n`
      );
    })
    .join('');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
      `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
      `  <url>\n` +
      `    <loc>${origin}/</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>daily</changefreq>\n` +
      `    <priority>1.0</priority>\n` +
      `  </url>\n` +
      legalEntries +
      `</urlset>\n`,
  );
});

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: 'API route not found.' },
  });
});

const clientIndex = path.join(config.clientDirectory, 'index.html');
if (existsSync(clientIndex)) {
  app.get('/index.html', (req, res) => {
    const queryStart = req.url.indexOf('?');
    const query = queryStart >= 0 ? req.url.slice(queryStart) : '';
    res.redirect(301, `/${query}`);
  });
  app.use(
    express.static(config.clientDirectory, {
      index: false,
      maxAge: config.isProduction ? '1h' : 0,
    }),
  );
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();
    if (path.extname(req.path) && !req.path.endsWith('.html')) return next();
    if (!req.accepts('html')) return next();

    try {
      const html = readFileSync(clientIndex, 'utf8');
      const lang = resolveHtmlLang(req.query.lang, req.get('accept-language'));
      res.vary('Accept-Language');
      res.setHeader('Content-Language', lang);
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(localizeHtml(html, lang, requestOrigin(req)));
    } catch (error) {
      next(error);
    }
  });
}

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: { code: 'invalid_json', message: 'Request body is not valid JSON.' },
    });
    return;
  }
  if (isDatabaseUnavailable(error)) {
    console.error('[db] request failed', error);
    res.status(503).json({
      error: {
        code: 'database_unavailable',
        message: 'The database is not available. Try again later.',
      },
    });
    return;
  }
  console.error('[server]', error);
  res.status(500).json({
    error: { code: 'internal', message: 'Something went wrong.' },
  });
};

app.use(errorHandler);
