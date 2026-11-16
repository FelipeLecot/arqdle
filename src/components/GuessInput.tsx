import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { BuildingOption, GuessRecord } from '../../shared/types';
import { useI18n } from '../i18n/I18nProvider';
import {
  localizedAliases,
  localizedBuildingName,
  localizedCity,
  localizedCountryName,
} from '../i18n/display';
import { ArrowRightIcon } from './Icon';

interface GuessInputProps {
  options: BuildingOption[];
  guesses: GuessRecord[];
  onSubmit: (buildingId: string) => Promise<boolean>;
  error: string | null;
  disabled?: boolean;
  submitting?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’.,()]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function optionNames(option: BuildingOption, lang: 'en' | 'es'): string[] {
  return [
    option.name,
    localizedBuildingName(option.id, option.name, lang),
    localizedBuildingName(option.id, option.name, 'es'),
    ...(option.aliases ?? []),
    ...localizedAliases(option.id, lang),
    ...localizedAliases(option.id, 'es'),
  ];
}

function optionHint(option: BuildingOption, lang: 'en' | 'es'): string {
  if (!option.city || !option.country) return option.hint;
  const city = localizedCity(option.id, option.city, lang);
  const country = localizedCountryName(option.country, lang);
  return city === country ? city : `${city}, ${country}`;
}

function scoreOption(option: BuildingOption, query: string, lang: 'en' | 'es'): number {
  const names = optionNames(option, lang).map(normalize);
  const hints = [optionHint(option, 'en'), optionHint(option, 'es')].map(normalize);
  if (names.some((name) => name.startsWith(query))) return 0;
  if (names.some((name) => name.includes(query))) return 1;
  if (hints.some((hint) => hint.includes(query))) return 2;
  return Number.POSITIVE_INFINITY;
}

export function GuessInput({
  options,
  guesses,
  onSubmit,
  error,
  disabled = false,
  submitting = false,
  onOpenChange,
}: GuessInputProps) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = normalize(query);
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return options
      .map((option) => ({ option, score: scoreOption(option, normalizedQuery, lang) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort(
        (a, b) =>
          a.score - b.score ||
          localizedBuildingName(a.option.id, a.option.name, lang).localeCompare(
            localizedBuildingName(b.option.id, b.option.name, lang),
            lang === 'es' ? 'es' : 'en',
          ),
      )
      .slice(0, 8)
      .map((entry) => entry.option);
  }, [lang, normalizedQuery, options]);

  const exactMatch = useMemo(() => {
    if (!normalizedQuery) return null;
    return (
      options.find((option) =>
        optionNames(option, lang).some((name) => normalize(name) === normalizedQuery),
      ) ?? null
    );
  }, [lang, normalizedQuery, options]);

  const guessedIds = useMemo(() => new Set(guesses.map((guess) => guess.id)), [guesses]);

  useEffect(() => {
    setQuery('');
    setSelectedId(null);
    setOpen(false);
    setActiveIndex(-1);
    setLocalError(null);
  }, [guesses.length]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    return () => onOpenChange?.(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const option = results[activeIndex];
    if (!option) return;
    document.getElementById(`guess-option-${option.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, results]);

  function chooseOption(option: BuildingOption) {
    setQuery(localizedBuildingName(option.id, option.name, lang));
    setSelectedId(option.id);
    setOpen(false);
    setActiveIndex(-1);
    setLocalError(null);
    inputRef.current?.focus();
  }

  function handleChange(value: string) {
    setQuery(value);
    setSelectedId(null);
    setActiveIndex(-1);
    setLocalError(null);
    setOpen(value.trim().length > 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((current) => (current < 0 ? 0 : (current + 1) % results.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? results.length - 1 : (current - 1) % results.length,
      );
      return;
    }
    if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        chooseOption(results[activeIndex]);
      } else if (!exactMatch && open && results[0]) {
        event.preventDefault();
        chooseOption(results[0]);
      }
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) return;

    const option = selectedId
      ? options.find((candidate) => candidate.id === selectedId)
      : exactMatch;
    if (!option) {
      setLocalError(t('chooseFromList'));
      setOpen(true);
      return;
    }
    if (guessedIds.has(option.id)) {
      setLocalError(t('alreadyGuessedError'));
      return;
    }

    setLocalError(null);
    const accepted = await onSubmit(option.id);
    if (accepted) {
      setQuery('');
      setSelectedId(null);
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const visibleError = localError ?? error;
  const canSubmit = Boolean(selectedId || exactMatch) && !disabled && !submitting;

  return (
    <div className="guess-area">
      <form className="guess-form" onSubmit={handleSubmit} noValidate>
        <div className="combobox" ref={wrapperRef}>
          <label className="sr-only" htmlFor="building-guess">
            {t('guessInputLabel')}
          </label>
          <input
            ref={inputRef}
            id="building-guess"
            className="guess-input"
            type="text"
            placeholder={options.length ? t('placeholder') : t('loadingBuildings')}
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            onFocus={() => {
              if (query.trim() && !selectedId) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="guess-suggestions"
            aria-activedescendant={
              open && activeIndex >= 0 && results[activeIndex]
                ? `guess-option-${results[activeIndex].id}`
                : undefined
            }
            aria-invalid={visibleError ? true : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            disabled={disabled || options.length === 0}
          />

          {open && normalizedQuery.length > 0 && (
            <div
              className="suggestions"
              id="guess-suggestions"
              role="listbox"
              aria-label={t('suggestionsLabel')}
            >
              {results.length === 0 ? (
                <p className="suggestions__empty">{t('noMatches')}</p>
              ) : (
                results.map((option, index) => (
                  <div
                    id={`guess-option-${option.id}`}
                    key={option.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`suggestion${guessedIds.has(option.id) ? ' suggestion--used' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseOption(option)}
                  >
                    <span className="suggestion__name">
                      {localizedBuildingName(option.id, option.name, lang)}
                    </span>
                    <span className="suggestion__hint">
                      {guessedIds.has(option.id) ? t('alreadyGuessed') : optionHint(option, lang)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button type="submit" className="guess-submit" disabled={!canSubmit}>
          {submitting ? t('checking') : t('guessButton')}
          {!submitting && <ArrowRightIcon />}
        </button>
      </form>

      <div className="form-message" aria-live="polite">
        {visibleError ? (
          <p className="form-error" role="alert">
            {visibleError}
          </p>
        ) : !open ? (
          <p className="form-hint">{t('hint')}</p>
        ) : null}
      </div>
    </div>
  );
}
