import type { Answer, AnswerImage, GuessCell, Stats } from '../../shared/types';

export interface UserRow {
  id: string;
  kind: 'guest' | 'google';
  email: string | null;
  email_verified: boolean;
  name: string | null;
  picture_url: string | null;
  locale: string | null;
  created_at: Date;
  updated_at: Date;
  last_seen_at: Date;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: Date;
  last_seen_at: Date;
  expires_at: Date;
}

export interface DailyPuzzleRow {
  puzzle_date: string;
  day_number: number;
  target_building_id: string;
  target_snapshot: unknown;
  created_at: Date;
}

export interface GameRow {
  id: string;
  user_id: string;
  mode: 'daily' | 'practice';
  puzzle_date: string | null;
  day_number: number | null;
  target_building_id: string;
  target_snapshot: unknown;
  status: 'playing' | 'won' | 'lost';
  attempts: number;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface GuessRow {
  id: string;
  game_id: string;
  user_id: string;
  attempt: number;
  building_id: string;
  building_name: string;
  cells: GuessCell[];
  correct: boolean;
  created_at: Date;
}

export interface DailyResultRow {
  user_id: string;
  puzzle_date: string;
  day_number: number;
  status: 'won' | 'lost';
  attempts: number;
  target_building_id: string;
  completed_at: Date;
}

export interface OAuthAccountRow {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthStateRow {
  state_hash: string;
  code_verifier: string;
  nonce: string;
  user_id: string | null;
  redirect_to: string | null;
  created_at: Date;
  expires_at: Date;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  locale?: string;
}

export interface AnswerWithImage extends Answer {
  image?: AnswerImage;
}

export type { Answer, GuessCell, Stats };
