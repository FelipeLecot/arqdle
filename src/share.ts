import type { CellStatus, GameStatus, GuessRecord, Mode } from '../shared/types';
import type { Lang } from './i18n/translations';

const SQUARES: Record<CellStatus, string> = {
  green: '🟩',
  yellow: '🟨',
  red: '🟥',
};

export interface ShareGame {
  mode: Mode;
  dayNumber?: number;
  guesses: GuessRecord[];
  status: GameStatus;
  maxGuesses: number;
}

export function buildShareText(game: ShareGame, lang: Lang = 'en'): string {
  const score =
    game.status === 'won' ? `${game.guesses.length}/${game.maxGuesses}` : `X/${game.maxGuesses}`;
  const label =
    game.mode === 'daily' && game.dayNumber
      ? `ARCHDLE #${String(game.dayNumber).padStart(3, '0')}`
      : `ARCHDLE ${lang === 'es' ? 'práctica' : 'practice'}`;
  const rows = game.guesses.map((guess) =>
    guess.cells.map((cell) => SQUARES[cell.status]).join(''),
  );
  const url =
    typeof window === 'undefined'
      ? ''
      : (() => {
          const parsed = new URL(window.location.href);
          const params = new URLSearchParams();
          if (lang === 'es') params.set('lang', 'es');
          if (game.mode === 'practice') params.set('mode', 'practice');
          const query = params.toString();
          return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ''}`;
        })();
  return [label, score, '', ...rows, '', url].join('\n').trim();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}
