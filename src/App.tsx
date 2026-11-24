import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_GUESSES,
  type BuildingOption,
  type GameView,
  type Me,
  type Mode,
} from '../shared/types';
import { emptyStats } from '../shared/stats';
import {
  ApiError,
  deleteAccount,
  exportDataUrl,
  loadBuildings,
  loadDailyGame,
  loadMe,
  loadPracticeGame,
  signOut,
  submitGameGuess,
} from './api';
import { GuessBoard } from './components/GuessBoard';
import { GuessInput } from './components/GuessInput';
import { Header } from './components/Header';
import { HowToPlay } from './components/HowToPlay';
import { ModeTabs } from './components/ModeTabs';
import { RevealPanel } from './components/RevealPanel';
import { StatsModal } from './components/StatsModal';
import { formatDateLabel, padDay } from './format';
import { useI18n } from './i18n/I18nProvider';
import { localizedErrorMessage } from './i18n/errors';
import { buildShareText, copyText } from './share';
import { hasSeenIntro, markIntroSeen } from './storage';

interface GameState {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  submitError: string | null;
  game: GameView | null;
  submitting: boolean;
  revealPending: boolean;
}

interface GameController {
  state: GameState;
  submit: (buildingId: string) => Promise<boolean>;
  retry: () => void;
  startNew: () => void;
}

function emptyGame(): GameState {
  return {
    phase: 'idle',
    error: null,
    submitError: null,
    game: null,
    submitting: false,
    revealPending: false,
  };
}

function prefetchAnswerImage(game: GameView | null): void {
  const src = game?.answer?.image?.src;
  if (!src || typeof window === 'undefined') return;
  const image = new window.Image();
  image.src = src;
}

function useGame(mode: Mode, enabled: boolean): GameController {
  const { lang, t } = useI18n();
  const [state, setState] = useState<GameState>(emptyGame);
  const stateRef = useRef(state);
  const startedRef = useRef(false);
  const requestRef = useRef(0);
  const revealTimerRef = useRef<number | null>(null);
  stateRef.current = state;

  const apply = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearRevealTimer(), [clearRevealTimer]);

  const load = useCallback(
    async (newGame: boolean, excludeId?: string) => {
      clearRevealTimer();
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      apply({ ...emptyGame(), phase: 'loading' });

      try {
        const game =
          mode === 'daily'
            ? await loadDailyGame()
            : await loadPracticeGame(newGame, excludeId);
        if (requestRef.current !== requestId) return;
        prefetchAnswerImage(game);
        apply({
          phase: 'ready',
          error: null,
          submitError: null,
          game,
          submitting: false,
          revealPending: false,
        });
      } catch (error) {
        if (requestRef.current !== requestId) return;
        apply({
          ...emptyGame(),
          phase: 'error',
          error: localizedErrorMessage(error, lang),
        });
      }
    },
    [apply, clearRevealTimer, lang, mode],
  );

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    void load(false);
  }, [enabled, load]);

  const submit = useCallback(
    async (buildingId: string): Promise<boolean> => {
      const current = stateRef.current;
      const game = current.game;
      if (
        current.phase !== 'ready' ||
        !game ||
        game.status !== 'playing' ||
        current.submitting
      ) {
        return false;
      }
      if (game.guesses.some((guess) => guess.id === buildingId)) {
        apply({ ...current, submitError: t('alreadyGuessedError') });
        return false;
      }

      const gameId = game.id;
      apply({ ...current, submitting: true, submitError: null });

      try {
        const updated = await submitGameGuess(gameId, buildingId);
        const latest = stateRef.current;
        if (latest.game?.id !== gameId) return false;
        const finished = updated.status !== 'playing' && Boolean(updated.answer);
        clearRevealTimer();
        if (finished) prefetchAnswerImage(updated);
        apply({
          ...latest,
          submitting: false,
          submitError: null,
          game: updated,
          revealPending: finished,
        });

        if (finished) {
          const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const delay = reduceMotion ? 120 : 950;
          revealTimerRef.current = window.setTimeout(() => {
            revealTimerRef.current = null;
            const currentState = stateRef.current;
            if (
              currentState.game?.id === gameId &&
              currentState.game.status !== 'playing'
            ) {
              apply({ ...currentState, revealPending: false });
            }
          }, delay);
        }
        return true;
      } catch (error) {
        const latest = stateRef.current;
        if (latest.game?.id !== gameId) return false;

        if (
          error instanceof ApiError &&
          (error.code === 'game_not_found' || error.code === 'daily_closed')
        ) {
          void load(false);
          return false;
        }

        apply({
          ...latest,
          submitting: false,
          submitError: localizedErrorMessage(error, lang),
        });
        return false;
      }
    },
    [apply, clearRevealTimer, lang, load, t],
  );

  const retry = useCallback(() => {
    void load(false);
  }, [load]);

  const startNew = useCallback(() => {
    if (mode !== 'practice') return;
    const current = stateRef.current.game;
    const previous = current?.answer?.id ?? current?.guesses.at(-1)?.id;
    void load(true, previous);
  }, [load, mode]);

  return { state, submit, retry, startNew };
}

function initialMode(): Mode {
  if (typeof window === 'undefined') return 'daily';
  return new URLSearchParams(window.location.search).get('mode') === 'practice'
    ? 'practice'
    : 'daily';
}

let bootstrapPromise: Promise<Me> | null = null;

export function App() {
  const { lang, t } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [me, setMe] = useState<Me | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [authNotice, setAuthNotice] = useState<'ok' | 'error' | null>(null);

  const daily = useGame('daily', bootstrapDone);
  const practice = useGame('practice', bootstrapDone && mode === 'practice');
  const game = mode === 'daily' ? daily : practice;
  const revealPending = game.state.revealPending;
  const guessCount = game.state.game?.guesses.length ?? 0;

  useEffect(() => {
    if (!revealPending) return;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('last-guess')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }, [revealPending, guessCount]);

  const [options, setOptions] = useState<BuildingOption[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const shareTimer = useRef<number | null>(null);
  const refreshedGame = useRef<string | null>(null);

  const refreshMe = useCallback(async () => {
    const next = await loadMe();
    setMe(next);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!bootstrapPromise) bootstrapPromise = loadMe();
    void bootstrapPromise
      .then((profile) => {
        if (!cancelled) setMe(profile);
      })
      .catch((error: unknown) => {
        if (!cancelled) setBootstrapError(localizedErrorMessage(error, lang));
      })
      .finally(() => {
        if (!cancelled) setBootstrapDone(true);
      });
    return () => {
      cancelled = true;
    };
    // The promise is shared across React StrictMode's development remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadBuildings()
      .then((buildings) => {
        if (!cancelled) setOptions(buildings);
      })
      .catch((error: unknown) => {
        if (!cancelled) setOptionsError(localizedErrorMessage(error, lang));
      });
    return () => {
      cancelled = true;
    };
    // The initial list is language-neutral. The error text is localized when it occurs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const auth = url.searchParams.get('auth');
    if (auth === 'ok' || auth === 'error') {
      setAuthNotice(auth);
      url.searchParams.delete('auth');
      url.searchParams.delete('reason');
      window.history.replaceState({}, '', url);
    }
  }, []);

  const dailyGame = daily.state.game;
  const dailyStatus = dailyGame?.status;
  useEffect(() => {
    if (!dailyGame || (dailyStatus !== 'won' && dailyStatus !== 'lost')) return;
    if (refreshedGame.current === dailyGame.id) return;
    refreshedGame.current = dailyGame.id;
    void refreshMe().catch(() => {
      // The result is saved. Stats refresh can wait for the next page load.
    });
  }, [dailyGame, dailyStatus, refreshMe]);

  const readyForIntro = daily.state.phase === 'ready' || practice.state.phase === 'ready';
  useEffect(() => {
    if (!readyForIntro || hasSeenIntro()) return;
    setHelpOpen(true);
    markIntroSeen();
  }, [readyForIntro]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (mode === 'practice') url.searchParams.set('mode', 'practice');
    else url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
  }, [mode]);

  useEffect(() => {
    document.title =
      mode === 'daily' && dailyGame?.dayNumber
        ? t('pageTitleDaily', { number: padDay(dailyGame.dayNumber) })
        : t('pageTitle');
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', t('metaDescription'));
  }, [dailyGame?.dayNumber, lang, mode, t]);

  useEffect(() => {
    setShareMessage(null);
  }, [mode]);

  useEffect(() => {
    return () => {
      if (shareTimer.current !== null) window.clearTimeout(shareTimer.current);
    };
  }, []);

  const handleModeChange = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewPractice = () => {
    practice.startNew();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewDaily = () => {
    daily.retry();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHelp = () => {
    markIntroSeen();
    setHelpOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch {
      setBootstrapError(t('accountError'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('deleteAccountConfirm'))) return;
    try {
      await deleteAccount();
      window.location.href = '/';
    } catch {
      setBootstrapError(t('accountError'));
    }
  };

  const handleShare = async () => {
    const current = game.state.game;
    if (!current?.answer) return;
    const text = buildShareText(
      {
        mode,
        dayNumber: current.dayNumber,
        guesses: current.guesses,
        status: current.status,
        maxGuesses: current.maxGuesses,
      },
      lang,
    );
    const copied = await copyText(text);
    setShareMessage(copied ? t('copied') : t('copyFailed'));
    if (shareTimer.current !== null) window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareMessage(null), 2600);
  };

  const maxGuesses = game.state.game?.maxGuesses ?? MAX_GUESSES;
  const usedGuesses = game.state.game?.guesses.length ?? 0;
  const dailyDateLabel = dailyGame?.date
    ? formatDateLabel(dailyGame.date, lang)
    : dailyGame?.dateLabel;
  const dailyMeta = dailyGame?.dayNumber
    ? `${t('dailyNumber', { number: padDay(dailyGame.dayNumber) })}${
        dailyDateLabel ? ` · ${dailyDateLabel}` : ''
      }`
    : t('dailyPuzzle');

  const renderGame = () => {
    const current = game.state;

    if (current.phase === 'idle' || current.phase === 'loading') {
      return <GameSkeleton />;
    }
    if (current.phase === 'error' || !current.game) {
      return (
        <ErrorCard
          message={current.error ?? t('loadErrorFallback')}
          onRetry={game.retry}
        />
      );
    }

    const view = current.game;
    const currentGuessNumber =
      view.status === 'playing'
        ? Math.min(view.guesses.length + 1, maxGuesses)
        : view.guesses.length;
    const guessLabel = t(view.status === 'playing' ? 'guessLabel' : 'guessesLabel');

    return (
      <>
        <div className="guess-meter" aria-live="polite">
          <div className="guess-meter__main">
            <span className="guess-meter__label">{guessLabel}</span>
            <span className="guess-meter__number">{currentGuessNumber}</span>
            <span className="guess-meter__total">
              {t('ofTotal', { total: maxGuesses })}
            </span>
          </div>
          <span className="progress-dots" aria-hidden="true">
            {Array.from({ length: maxGuesses }, (_, index) => (
              <span
                className={`progress-dot${index < usedGuesses ? ' progress-dot--used' : ''}`}
                key={index}
              />
            ))}
          </span>
        </div>

        <GuessBoard guesses={view.guesses} />

        {view.status === 'playing' ? (
          <GuessInput
            key={mode}
            options={options}
            guesses={view.guesses}
            onSubmit={game.submit}
            error={optionsError ?? current.submitError}
            submitting={current.submitting}
            disabled={current.phase !== 'ready'}
            onOpenChange={setSuggestionsOpen}
          />
        ) : view.answer && !current.revealPending ? (
          <RevealPanel
            answer={view.answer}
            status={view.status === 'won' ? 'won' : 'lost'}
            attempts={view.guesses.length}
            mode={mode}
            nextDailyAt={dailyGame?.nextDailyAt}
            shareMessage={shareMessage}
            onShare={handleShare}
            onNewPractice={handleNewPractice}
            onPlayPractice={() => handleModeChange('practice')}
            onNewDaily={handleNewDaily}
          />
        ) : view.answer ? null : (
          <div className="finished-card">
            <p>{t('finishedGame')}</p>
            <button
              type="button"
              className="button button--primary"
              onClick={mode === 'practice' ? handleNewPractice : () => handleModeChange('practice')}
            >
              {mode === 'practice' ? t('startNewBuilding') : t('playPractice')}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="app">
      <Header
        onHelp={handleHelp}
        onStats={() => setStatsOpen(true)}
        me={me}
        onSignOut={handleSignOut}
        onDeleteAccount={handleDeleteAccount}
        exportUrl={exportDataUrl}
      />

      <main className="main">
        {authNotice && (
          <div
            className={`app-notice app-notice--${authNotice === 'ok' ? 'ok' : 'error'}`}
            role="status"
          >
            <span>{t(authNotice === 'ok' ? 'authSuccess' : 'authError')}</span>
            <button
              type="button"
              className="app-notice__close"
              onClick={() => setAuthNotice(null)}
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
        )}

        {bootstrapError && (
          <div className="app-notice app-notice--error" role="alert">
            <span>{bootstrapError}</span>
            <button
              type="button"
              className="app-notice__close"
              onClick={() => setBootstrapError(null)}
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
        )}

        <div className="game-head">
          <ModeTabs mode={mode} onChange={handleModeChange} />
          <div className="game-meta-row">
            <p className="game-meta">{mode === 'daily' ? dailyMeta : t('practiceMeta')}</p>
            {mode === 'practice' &&
              practice.state.phase === 'ready' &&
              practice.state.game?.status === 'playing' && (
                <button type="button" className="text-button" onClick={handleNewPractice}>
                  {t('newBuilding')}
                </button>
              )}
          </div>
        </div>

        {renderGame()}

        <div
          className={`legend${suggestionsOpen ? ' legend--hidden' : ''}`}
          aria-label={t('howToReadClues')}
        >
          <span className="legend__item">
            <span className="swatch swatch--green" aria-hidden="true" /> {t('legendExact')}
          </span>
          <span className="legend__item">
            <span className="swatch swatch--yellow" aria-hidden="true" /> {t('legendClose')}
          </span>
          <span className="legend__item">
            <span className="swatch swatch--red" aria-hidden="true" /> {t('legendNoMatch')}
          </span>
          <span className="legend__item">
            <span className="legend__arrow" aria-hidden="true">
              ↓
            </span>{' '}
            {t('legendOlder')}
          </span>
          <span className="legend__item">
            <span className="legend__arrow" aria-hidden="true">
              ↑
            </span>{' '}
            {t('legendNewer')}
          </span>
        </div>
      </main>

      <footer className="footer">
        <p>{t('footerTagline')}</p>
        <p>
          {t('footerAttribution')}{' '}
          <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">
            Wikimedia Commons
          </a>
          .
        </p>
        <p className="footer__credit">
          {t('footerCreditPrefix')}{' '}
          <a href="https://www.felipelecot.com" target="_blank" rel="noreferrer">
            Felipe Lecot
          </a>
          .
        </p>
        <nav className="footer__legal" aria-label={t('legalNav')}>
          <a href={lang === 'en' ? '/legal/en/terms' : '/legal/terms'}>
            {t('termsOfService')}
          </a>
          <span aria-hidden="true">·</span>
          <a href={lang === 'en' ? '/legal/en/privacy' : '/legal/privacy'}>
            {t('privacyPolicy')}
          </a>
        </nav>
      </footer>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={me?.profile.stats ?? emptyStats()}
      />
    </div>
  );
}

function GameSkeleton() {
  const { t } = useI18n();
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label={t('loadingPuzzle')}>
      <div className="skeleton skeleton--status" />
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <div className="skeleton skeleton--tile" key={index} />
        ))}
      </div>
      <div className="skeleton skeleton--input" />
      <div className="skeleton skeleton--hint" />
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="error-card" role="alert">
      <h2>{t('loadErrorTitle')}</h2>
      <p>{message}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        {t('retry')}
      </button>
    </div>
  );
}
