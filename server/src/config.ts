import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidDateKey } from './dates';

function readPort(value: string | undefined): number {
  const port = Number(value ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function readSessionTtlDays(value: string | undefined): number {
  const days = Number(value ?? 30);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error(`Invalid SESSION_TTL_DAYS, expected 1-365: ${value}`);
  }
  return days;
}

function readAdminEmails(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

const isProduction = process.env.NODE_ENV === 'production';
const port = readPort(process.env.PORT);

const siteUrl = process.env.SITE_URL?.trim().replace(/\/+$/, '') || '';
if (siteUrl && !/^https?:\/\//.test(siteUrl)) {
  throw new Error(`Invalid SITE_URL, expected http(s) origin: ${siteUrl}`);
}

const timezone = process.env.PUZZLE_TIMEZONE?.trim() || 'America/Montevideo';
try {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
} catch {
  throw new Error(`Invalid PUZZLE_TIMEZONE: ${timezone}`);
}

const epoch = process.env.DAILY_EPOCH?.trim() || '2026-11-16';
if (!isValidDateKey(epoch)) {
  throw new Error(`Invalid DAILY_EPOCH, expected YYYY-MM-DD: ${epoch}`);
}

const configuredSchedule = process.env.DAILY_SCHEDULE?.trim();
const sourceSchedule = path.resolve(process.cwd(), 'server/data/daily.json');
const bundledSchedule = fileURLToPath(new URL('./data/daily.json', import.meta.url));
const scheduleCandidates = [configuredSchedule, sourceSchedule, bundledSchedule].filter(
  (candidate): candidate is string => Boolean(candidate),
);
const dailySchedulePath =
  scheduleCandidates.find((candidate) => existsSync(candidate)) ?? sourceSchedule;

const databaseUrl = process.env.DATABASE_URL?.trim() || null;
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error('Invalid DATABASE_URL, expected postgres://user:password@host:port/database');
  }
}

type DatabaseSsl = false | { rejectUnauthorized: boolean; ca?: string };

function readDatabaseCa(): string | undefined {
  const value = process.env.DATABASE_CA_CERT?.trim();
  if (!value) return undefined;
  if (value.includes('BEGIN CERTIFICATE')) return value.replaceAll('\\n', '\n');
  if (existsSync(value)) return readFileSync(value, 'utf8');
  throw new Error('DATABASE_CA_CERT must be a PEM certificate or a path to one.');
}

function readDatabaseSsl(): DatabaseSsl {
  if (!databaseUrl) return false;
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  const host = new URL(databaseUrl).hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const mode = raw || (local ? 'disable' : 'require');

  if (mode === 'disable') return false;
  const ca = readDatabaseCa();
  if (mode === 'require') {
    return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: false };
  }
  if (mode === 'verify-full') {
    return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
  }
  throw new Error(`Invalid DATABASE_SSL, expected disable, require or verify-full: ${mode}`);
}

const databaseSsl = readDatabaseSsl();

/**
 * Treat Secrets Manager placeholders as unset. The CDK stack creates the Google
 * secrets with a PLACEHOLDER value so the ExternalSecret can resolve before the
 * real OAuth client exists. Without this guard the sign-in button would appear
 * and fail at Google.
 */
function readOptionalSecret(value: string | undefined): string {
  const trimmed = value?.trim() || '';
  return trimmed.startsWith('PLACEHOLDER') ? '' : trimmed;
}

const googleClientId = readOptionalSecret(process.env.GOOGLE_CLIENT_ID);
const googleClientSecret = readOptionalSecret(process.env.GOOGLE_CLIENT_SECRET);
if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error('Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither.');
}
const googleRedirectUri =
  process.env.GOOGLE_REDIRECT_URI?.trim() ||
  (siteUrl
    ? `${siteUrl}/api/auth/google/callback`
    : `http://localhost:${port}/api/auth/google/callback`);
const googleEnabled = Boolean(googleClientId && googleClientSecret);

const adminToken = process.env.ADMIN_TOKEN?.trim() || '';
if (isProduction && adminToken && adminToken.length < 16) {
  throw new Error('ADMIN_TOKEN must be at least 16 characters.');
}

const sourceMigrations = path.resolve(process.cwd(), 'server/sql/migrations');
const bundledMigrations = fileURLToPath(new URL('./sql/migrations', import.meta.url));
const migrationsDirectory = existsSync(sourceMigrations)
  ? sourceMigrations
  : bundledMigrations;

export const config = {
  port,
  isProduction,
  timezone,
  epoch,
  dailySeed: process.env.DAILY_SEED?.trim() || 'arqdle-2026',
  maxGuesses: 10,
  siteUrl,
  dailySchedulePath,
  clientDirectory: path.resolve(process.cwd(), 'dist/client'),
  database: {
    url: databaseUrl,
    ssl: databaseSsl,
    autoMigrate: readBoolean(process.env.DB_AUTO_MIGRATE, true),
    migrationsDirectory,
  },
  session: {
    cookieName: 'arqdle_session',
    ttlDays: readSessionTtlDays(process.env.SESSION_TTL_DAYS),
    secureCookies: readBoolean(process.env.COOKIE_SECURE, isProduction),
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
  },
  google: {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    redirectUri: googleRedirectUri,
    enabled: googleEnabled,
  },
  admin: {
    emails: readAdminEmails(process.env.ADMIN_EMAILS),
    token: adminToken || null,
  },
} as const;
