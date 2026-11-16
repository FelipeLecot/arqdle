import express, { type ErrorRequestHandler, type Request } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { BuildingOption, Mode } from '../../shared/types';
import { config } from './config';
import { buildings } from './data';
import { ApiError } from './errors';
import { getWikipediaImage } from './images';
import { createPuzzle, resolveGuess } from './puzzle';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, buildings: buildings.length });
});

function requestOrigin(req: Request): string {
  if (config.siteUrl) return config.siteUrl;
  const forwarded = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return `${forwarded || req.protocol}://${req.get('host') ?? 'localhost'}`;
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
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n` +
      `    <loc>${origin}/</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>daily</changefreq>\n` +
      `    <priority>1.0</priority>\n` +
      `  </url>\n` +
      `</urlset>\n`,
  );
});

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
  res.setHeader('Cache-Control', 'no-store');
  res.json(options);
});

app.get('/api/puzzle', (req, res) => {
  const requested = typeof req.query.mode === 'string' ? req.query.mode : 'daily';
  if (requested !== 'daily' && requested !== 'practice') {
    throw new ApiError(400, 'invalid_mode', 'Mode must be daily or practice.');
  }
  const exclude =
    requested === 'practice' && typeof req.query.exclude === 'string'
      ? req.query.exclude
      : undefined;

  res.setHeader('Cache-Control', 'no-store');
  res.json(createPuzzle(requested as Mode, exclude));
});

app.post('/api/guess', async (req, res) => {
  const body = req.body as { token?: unknown; guessId?: unknown } | null;
  if (
    !body ||
    typeof body.token !== 'string' ||
    typeof body.guessId !== 'string' ||
    body.token.length < 20 ||
    body.token.length > 2000 ||
    body.guessId.length < 1 ||
    body.guessId.length > 100
  ) {
    throw new ApiError(400, 'invalid_request', 'A puzzle token and a building id are required.');
  }

  const resolution = resolveGuess(body.token, body.guessId);
  if (resolution.answerBuilding && resolution.result.answer) {
    resolution.result.answer.image = await getWikipediaImage(
      resolution.answerBuilding.wikiTitle,
      resolution.answerBuilding.name,
    );
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json(resolution.result);
});

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: 'API route not found.' },
  });
});

const clientIndex = path.join(config.clientDirectory, 'index.html');
if (existsSync(clientIndex)) {
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
    res.sendFile(clientIndex);
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
  console.error('[server]', error);
  res.status(500).json({
    error: { code: 'internal', message: 'Something went wrong.' },
  });
};

app.use(errorHandler);
