import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_GUESSES,
  type Answer,
  type BuildingOption,
  type GameStatus,
  type GuessRecord,
  type Mode,
  type PuzzleStart,
  type Stats,
} from '../shared/types';
import { recordDailyResult } from '../shared/stats';
import { ApiError, loadBuildings, startPuzzle, submitGuess } from './api';
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
import {
  clearDaily,
  clearPractice,
  hasSeenIntro,
  loadDaily,
  loadPractice,
  loadStats,
  markIntroSeen,
  pruneDaily,
  saveDaily,
  savePractice,
  saveStats,
  type StoredGame,
} from './storage';

interface GameState {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  submitError: string | null;
  token: string | null;
  puzzle: PuzzleStart | null;
  guesses: GuessRecord[];
  status: GameStatus;
  answer?: Answer;
  submitting: boolean;
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
    token: null,
    puzzle: null,
    guesses: [],
    status: 'playing',
    submitting: false,
  };
}

function syntheticPuzzle(mode: Mode, stored: StoredGame): PuzzleStart {
  return {
    token: stored.token,
    mode,
    maxGuesses: MAX_GUESSES,
    dayNumber: stored.dayNumber,
    date: stored.date,
    dateLabel: stored.dateLabel,
  };
}

function useGame(mode: Mode, enabled: boolean): GameController {
  const { lang, t } = useI18n();
  const [state, setState] = useState<GameState>(emptyGame);
  const stateRef = useRef(state);
  const startedRef = useRef(false);
  const requestRef = useRef(0);
  stateRef.current = state;

  const apply = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const persist = useCallback(
    (game: GameState) => {
      if (!game.token) return;
      const stored: StoredGame = {
        token: game.token,
        guesses: game.guesses,
        status: game.status,
        answer: game.answer,
        dayNumber: game.puzzle?.dayNumber,
        date: game.puzzle?.date,
        dateLabel: game.puzzle?.dateLabel,
      };
      if (mode === 'daily') {
        if (game.puzzle?.date) saveDaily(game.puzzle.date, stored);
      } else {
        savePractice(stored);
      }
    },
    [mode],
  );

  const start = useCallback(
    async (forceNew: boolean, excludeId?: string) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      apply({ ...emptyGame(), phase: 'loading' });

      try {
        if (mode === 'practice' && !forceNew) {
          const stored = loadPractice();
          if (stored) {
            apply({
              phase: 'ready',
              error: null,
              submitError: null,
              token: stored.token,
              puzzle: syntheticPuzzle(mode, stored),
              guesses: stored.guesses,
              status: stored.status,
              answer: stored.answer,
              submitting: false,
            });
            return;
          }
        }

        const puzzle = await startPuzzle(mode, mode === 'practice' ? excludeId : undefined);
        if (requestRef.current !== requestId) return;

        if (mode === 'daily' && puzzle.date) {
          const stored = loadDaily(puzzle.date);
          if (stored) {
            apply({
              phase: 'ready',
              error: null,
              submitError: null,
              token: stored.token,
              puzzle,
              guesses: stored.guesses,
              status: stored.status,
              answer: stored.answer,
              submitting: false,
            });
            return;
          }
        }

        const ready: GameState = {
          ...emptyGame(),
          phase: 'ready',
          token: puzzle.token,
          puzzle,
        };
        apply(ready);
        persist(ready);
      } catch (error) {
        if (requestRef.current !== requestId) return;
        apply({
          ...emptyGame(),
          phase: 'error',
          error: localizedErrorMessage(error, lang),
        });
      }
    },
    [apply, lang, mode, persist],
  );

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    void start(false);
  }, [enabled, start]);

  const submit = useCallback(
    async (buildingId: string): Promise<boolean> => {
      const current = stateRef.current;
      if (
        current.phase !== 'ready' ||
        !current.token ||
        current.status !== 'playing' ||
        current.submitting
      ) {
        return false;
      }
      if (current.guesses.some((guess) => guess.id === buildingId)) {
        apply({ ...current, submitError: t('alreadyGuessedError') });
        return false;
      }

      const token = current.token;
      apply({ ...current, submitting: true, submitError: null });

      try {
        const result = await submitGuess(token, buildingId);
        const latest = stateRef.current;
        if (latest.token !== token) return false;

        const record: GuessRecord = {
          id: result.guess.id,
          name: result.guess.name,
          cells: result.cells,
          correct: result.status === 'won',
        };
        const next: GameState = {
          ...latest,
          submitting: false,
          submitError: null,
          token: result.token ?? latest.token,
          guesses: [...latest.guesses, record],
          status: result.status,
          answer: result.answer ?? latest.answer,
        };
        apply(next);
        persist(next);
        return true;
      } catch (error) {
        const latest = stateRef.current;
        if (latest.token !== token) return false;

        if (error instanceof ApiError && error.code === 'invalid_token') {
          if (mode === 'daily') {
            if (latest.puzzle?.date) clearDaily(latest.puzzle.date);
          } else {
            clearPractice();
          }
          apply({ ...emptyGame(), phase: 'loading' });
          void start(false);
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
    [apply, lang, mode, persist, start, t],
  );

  const retry = useCallback(() => {
    void start(false);
  }, [start]);

  const startNew = useCallback(() => {
    if (mode !== 'practice') return;
    const previous =
      stateRef.current.answer?.id ?? stateRef.current.guesses.at(-1)?.id ?? undefined;
    clearPractice();
    void start(true, previous);
  }, [mode, start]);

  return { state, submit, retry, startNew };
}

function initialMode(): Mode {
  if (typeof window === 'undefined') return 'daily';
  return new URLSearchParams(window.location.search).get('mode') === 'practice'
    ? 'practice'
    : 'daily';
}

export function App() {
  const { lang, t } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const daily = useGame('daily', true);
  const practice = useGame('practice', mode === 'practice');
  const game = mode === 'daily' ? daily : practice;

  const [options, setOptions] = useState<BuildingOption[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const shareTimer = useRef<number | null>(null);

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
    saveStats(stats);
  }, [stats]);

  const currentDailyDate = daily.state.puzzle?.date;
  useEffect(() => {
    if (currentDailyDate) pruneDaily(currentDailyDate);
  }, [currentDailyDate]);

  const dailyPhase = daily.state.phase;
  const dailyStatus = daily.state.status;
  const dailyAttempts = daily.state.guesses.length;
  const dailyDay = daily.state.puzzle?.dayNumber;

  useEffect(() => {
    if (dailyPhase !== 'ready' || dailyStatus === 'playing' || dailyAttempts === 0) return;
    if (!dailyDay) return;
    setStats((current) => recordDailyResult(current, dailyDay, dailyStatus, dailyAttempts));
  }, [dailyPhase, dailyStatus, dailyAttempts, dailyDay]);

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
      mode === 'daily' && daily.state.puzzle?.dayNumber
        ? t('pageTitleDaily', { number: padDay(daily.state.puzzle.dayNumber) })
        : t('pageTitle');
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', t('metaDescription'));
  }, [daily.state.puzzle?.dayNumber, lang, mode, t]);

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

  const handleShare = async () => {
    const current = game.state;
    if (!current.answer) return;
    const text = buildShareText(
      {
        mode,
        dayNumber: current.puzzle?.dayNumber,
        guesses: current.guesses,
        status: current.status,
        maxGuesses: current.puzzle?.maxGuesses ?? MAX_GUESSES,
      },
      lang,
    );
    const copied = await copyText(text);
    setShareMessage(copied ? t('copied') : t('copyFailed'));
    if (shareTimer.current !== null) window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareMessage(null), 2600);
  };

  const maxGuesses = game.state.puzzle?.maxGuesses ?? MAX_GUESSES;
  const usedGuesses = game.state.guesses.length;
  const dailyDateLabel = daily.state.puzzle?.date
    ? formatDateLabel(daily.state.puzzle.date, lang)
    : daily.state.puzzle?.dateLabel;
  const dailyMeta = daily.state.puzzle?.dayNumber
    ? `${t('dailyNumber', { number: padDay(daily.state.puzzle.dayNumber) })}${
        dailyDateLabel ? ` · ${dailyDateLabel}` : ''
      }`
    : t('dailyPuzzle');

  const renderGame = () => {
    const current = game.state;

    if (current.phase === 'idle' || current.phase === 'loading') {
      return <GameSkeleton />;
    }
    if (current.phase === 'error') {
      return <ErrorCard message={current.error ?? t('loadErrorFallback')} onRetry={game.retry} />;
    }

    const currentGuessNumber =
      current.status === 'playing'
        ? Math.min(usedGuesses + 1, maxGuesses)
        : usedGuesses;
    const guessLabel = t(current.status === 'playing' ? 'guessLabel' : 'guessesLabel');

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

        <GuessBoard guesses={current.guesses} />

        {current.status === 'playing' ? (
          <GuessInput
            key={mode}
            options={options}
            guesses={current.guesses}
            onSubmit={game.submit}
            error={optionsError ?? current.submitError}
            submitting={current.submitting}
            disabled={current.phase !== 'ready'}
            onOpenChange={setSuggestionsOpen}
          />
        ) : current.answer ? (
          <RevealPanel
            answer={current.answer}
            status={current.status === 'won' ? 'won' : 'lost'}
            attempts={usedGuesses}
            mode={mode}
            nextDailyAt={daily.state.puzzle?.nextDailyAt}
            shareMessage={shareMessage}
            onShare={handleShare}
            onNewPractice={handleNewPractice}
            onPlayPractice={() => handleModeChange('practice')}
            onNewDaily={handleNewDaily}
          />
        ) : (
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
      <Header onHelp={handleHelp} onStats={() => setStatsOpen(true)} />

      <main className="main">
        <div className="game-head">
          <ModeTabs mode={mode} onChange={handleModeChange} />
          <div className="game-meta-row">
            <p className="game-meta">{mode === 'daily' ? dailyMeta : t('practiceMeta')}</p>
            {mode === 'practice' &&
              practice.state.phase === 'ready' &&
              practice.state.status === 'playing' && (
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
      </footer>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} stats={stats} />
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
