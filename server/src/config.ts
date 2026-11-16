import 'dotenv/config';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
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

const isProduction = process.env.NODE_ENV === 'production';
const suppliedSecret = process.env.PUZZLE_SECRET?.trim();
const weakSecret =
  suppliedSecret === 'change-me-to-a-long-random-string' ||
  (suppliedSecret?.length ?? 0) < 24;
if (isProduction && suppliedSecret && weakSecret) {
  throw new Error('PUZZLE_SECRET is too weak. Use at least 24 random characters.');
}
const secret =
  suppliedSecret ||
  (isProduction
    ? crypto.randomBytes(32).toString('hex')
    : 'archdle-development-secret-do-not-use-in-production');

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

export const config = {
  port: readPort(process.env.PORT),
  isProduction,
  secret,
  secretWasGenerated: !suppliedSecret,
  timezone,
  epoch,
  dailySeed: process.env.DAILY_SEED?.trim() || 'archdle-2026',
  maxGuesses: 6,
  dailySchedulePath,
  clientDirectory: path.resolve(process.cwd(), 'dist/client'),
} as const;
