import { ApiError } from '../api';
import { translations, type Lang, type TranslationKey } from './translations';

const ERROR_KEYS: Record<string, TranslationKey> = {
  network: 'errorNetwork',
  invalid_token: 'errorInvalidToken',
  invalid_puzzle: 'errorInvalidPuzzle',
  invalid_guess: 'errorInvalidGuess',
  no_guesses_left: 'errorNoGuessesLeft',
  invalid_request: 'errorInvalidRequest',
  invalid_mode: 'errorInvalidMode',
  not_found: 'errorNotFound',
  internal: 'errorInternal',
  game_not_found: 'errorGameNotFound',
  invalid_game: 'errorInvalidGame',
  game_over: 'errorGameOver',
  daily_closed: 'errorDailyClosed',
  database_unavailable: 'errorDatabaseUnavailable',
  rate_limited: 'errorRateLimited',
  auth_failed: 'errorAuthFailed',
  google_not_configured: 'errorGoogleNotConfigured',
  not_admin: 'errorNotAdmin',
  invalid_import: 'errorInvalidImport',
  forbidden_origin: 'errorForbiddenOrigin',
};

export function localizedErrorMessage(error: unknown, lang: Lang): string {
  if (error instanceof ApiError) {
    const key = ERROR_KEYS[error.code];
    if (key) return translations[lang][key];
    return error.message || translations[lang].errorGeneric;
  }
  return translations[lang].errorGeneric;
}
