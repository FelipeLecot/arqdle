import crypto from 'node:crypto';
import type { Answer, GameStatus, GuessResponse, Mode, PuzzleStart } from '../../shared/types';
import { compareBuilding, formatYear } from './compare';
import { config } from './config';
import { randomPracticeBuilding, todayDailySelection } from './daily';
import { nextDailyAt } from './dates';
import { getBuilding } from './data';
import { ApiError } from './errors';
import type { Building } from './types';

interface TokenPayload {
  v: 1;
  b: string;
  m: Mode;
  d: string;
  g: number;
}

const key = crypto.createHash('sha256').update(config.secret).digest();
const IV_BYTES = 12;
const TAG_BYTES = 16;

function encodeToken(payload: TokenPayload): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decodeToken(token: string): TokenPayload {
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < IV_BYTES + TAG_BYTES + 1) throw new Error('short token');
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const encrypted = raw.subarray(IV_BYTES + TAG_BYTES);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    const payload = JSON.parse(plain) as Partial<TokenPayload>;

    if (
      payload.v !== 1 ||
      typeof payload.b !== 'string' ||
      (payload.m !== 'daily' && payload.m !== 'practice') ||
      typeof payload.d !== 'string' ||
      !Number.isInteger(payload.g) ||
      (payload.g ?? -1) < 0 ||
      (payload.g ?? 99) > config.maxGuesses
    ) {
      throw new Error('bad payload');
    }

    return payload as TokenPayload;
  } catch {
    throw new ApiError(
      400,
      'invalid_token',
      'This game session is no longer valid. Start a new game.',
    );
  }
}

export function createPuzzle(mode: Mode, excludeId?: string): PuzzleStart {
  if (mode === 'daily') {
    const daily = todayDailySelection();
    const payload: TokenPayload = {
      v: 1,
      b: daily.building.id,
      m: 'daily',
      d: daily.date,
      g: 0,
    };
    return {
      token: encodeToken(payload),
      mode,
      maxGuesses: config.maxGuesses,
      dayNumber: daily.dayNumber,
      date: daily.date,
      dateLabel: daily.dateLabel,
      nextDailyAt: nextDailyAt(new Date(), config.timezone).toISOString(),
    };
  }

  const excludes = new Set<string>();
  if (excludeId && getBuilding(excludeId)) excludes.add(excludeId);
  const building = randomPracticeBuilding(excludes);
  const payload: TokenPayload = {
    v: 1,
    b: building.id,
    m: 'practice',
    d: '',
    g: 0,
  };
  return {
    token: encodeToken(payload),
    mode,
    maxGuesses: config.maxGuesses,
  };
}

function toAnswer(building: Building): Answer {
  const wikiTitle = building.wikiTitle.replace(/ /g, '_');
  return {
    id: building.id,
    name: building.name,
    city: building.city,
    country: building.country,
    countryCode: building.countryCode,
    continent: building.continent,
    year: building.year,
    yearLabel: formatYear(building.year),
    yearNote: building.yearNote,
    style: building.style,
    type: building.type,
    use: building.use,
    materials: building.materials,
    architects: building.architects,
    heightM: building.heightM,
    blurb: building.blurb,
    fact: building.fact,
    wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`,
  };
}

export function getPuzzleTargetId(token: string): string {
  return decodeToken(token).b;
}

export interface GuessResolution {
  result: GuessResponse;
  answerBuilding?: Building;
}

export function resolveGuess(token: string, guessId: string): GuessResolution {
  const payload = decodeToken(token);
  const target = getBuilding(payload.b);
  if (!target) {
    throw new ApiError(400, 'invalid_puzzle', 'This puzzle is no longer available.');
  }

  const guess = getBuilding(guessId);
  if (!guess) {
    throw new ApiError(400, 'invalid_guess', 'That building is not in the game list.');
  }

  if (payload.g >= config.maxGuesses) {
    throw new ApiError(409, 'no_guesses_left', 'This game is already over.');
  }

  const attempts = payload.g + 1;
  const correct = target.id === guess.id;
  const status: GameStatus = correct
    ? 'won'
    : attempts >= config.maxGuesses
      ? 'lost'
      : 'playing';
  const nextToken =
    status === 'playing' ? encodeToken({ ...payload, g: attempts }) : null;

  const result: GuessResponse = {
    token: nextToken,
    status,
    guess: { id: guess.id, name: guess.name },
    cells: compareBuilding(target, guess),
    attempts,
    maxGuesses: config.maxGuesses,
  };

  if (status === 'playing') return { result };

  return {
    result: { ...result, answer: toAnswer(target) },
    answerBuilding: target,
  };
}
