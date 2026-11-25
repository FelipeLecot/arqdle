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

export const MAX_GUESSES = 10;

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
  /** All clues matched, but the building is not the hidden answer. */
  nearMiss?: boolean;
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
  architects?: string[];
  aliases?: string[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameView {
  id: string;
  mode: Mode;
  status: GameStatus;
  maxGuesses: number;
  attempts: number;
  guesses: GuessRecord[];
  dayNumber?: number;
  date?: string;
  dateLabel?: string;
  nextDailyAt?: string;
  answer?: Answer;
}

export interface Profile {
  id: string;
  kind: 'guest' | 'google';
  name: string | null;
  email: string | null;
  pictureUrl: string | null;
  createdAt: string;
  stats: Stats;
}

export interface Me {
  profile: Profile;
  auth: {
    googleEnabled: boolean;
    signInUrl: string;
  };
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
