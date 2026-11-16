export const ATTRIBUTE_KEYS = [
  'continent',
  'country',
  'built',
  'style',
  'type',
  'use',
  'material',
  'architect',
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  continent: 'Continent',
  country: 'Country',
  built: 'Built',
  style: 'Style',
  type: 'Type',
  use: 'Use',
  material: 'Material',
  architect: 'Architect',
};

export const MAX_GUESSES = 6;

export type Mode = 'daily' | 'practice';
export type CellStatus = 'green' | 'yellow' | 'red';
export type Direction = 'older' | 'newer';

export interface GuessCell {
  key: AttributeKey;
  status: CellStatus;
  /** Main value shown in the tile. */
  value: string;
  /** Small second line, for example the century or style family. */
  sub?: string;
  /** For the built column: whether the answer is older or newer. */
  direction?: Direction;
  /** Full sentence for screen readers and tooltips. */
  note: string;
}

export interface GuessRecord {
  id: string;
  name: string;
  cells: GuessCell[];
  correct: boolean;
}

export interface AnswerImage {
  src: string;
  alt: string;
  credit?: string;
  license?: string;
  pageUrl?: string;
}

export interface Answer {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  continent: string;
  year: number;
  yearLabel: string;
  yearNote?: string;
  style: string;
  type: string;
  use: string;
  materials: string[];
  architects: string[];
  heightM?: number;
  blurb: string;
  fact: string;
  wikiUrl: string;
  image?: AnswerImage;
}

export interface BuildingOption {
  id: string;
  name: string;
  hint: string;
  city: string;
  country: string;
  countryCode: string;
  aliases?: string[];
}

export interface PuzzleStart {
  token: string;
  mode: Mode;
  maxGuesses: number;
  dayNumber?: number;
  date?: string;
  dateLabel?: string;
  nextDailyAt?: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GuessResponse {
  token: string | null;
  status: GameStatus;
  guess: {
    id: string;
    name: string;
  };
  cells: GuessCell[];
  attempts: number;
  maxGuesses: number;
  answer?: Answer;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  lastDay: number | null;
  distribution: number[];
}
