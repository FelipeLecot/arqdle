import type { CSSProperties } from 'react';
import {
  ATTRIBUTE_KEYS,
  type GuessRecord,
} from '../../shared/types';
import { useI18n } from '../i18n/I18nProvider';
import {
  localizedAttributeLabel,
  localizedBuildingName,
  localizedCellNote,
  localizedCellSub,
  localizedCellValue,
} from '../i18n/display';
import { attributeTranslationKey } from '../i18n/translations';

interface GuessBoardProps {
  guesses: GuessRecord[];
}

const STATUS_MARK = {
  green: '✓',
  yellow: '≈',
  red: '✕',
} as const;

export function GuessBoard({ guesses }: GuessBoardProps) {
  const { lang, t } = useI18n();

  return (
    <section className="board" aria-label={t('submittedGuesses')}>
      <div className="board-head" aria-hidden="true">
        <div className="board-head__cell board-head__cell--name">{t('building')}</div>
        {ATTRIBUTE_KEYS.map((key) => (
          <div className="board-head__cell" key={key}>
            {t(attributeTranslationKey[key])}
          </div>
        ))}
      </div>

      {guesses.length === 0 ? (
        <div className="board-empty">
          <div className="empty-marks" aria-hidden="true">
            {ATTRIBUTE_KEYS.map((key) => (
              <span className="empty-mark" key={key} />
            ))}
          </div>
          <p>{t('emptyLine1')}</p>
          <p className="board-empty__sub">{t('emptyLine2')}</p>
        </div>
      ) : (
        <div className="board-rows">
          {guesses.map((guess, rowIndex) => (
            <div
              className={`guess-row${
                rowIndex === guesses.length - 1 ? ' guess-row--last' : ''
              }${guess.correct ? ' guess-row--correct' : ''}`}
              id={rowIndex === guesses.length - 1 ? 'last-guess' : undefined}
              key={`${guess.id}-${rowIndex}`}
            >
              <div className="guess-name">
                <span className="guess-name__index" aria-hidden="true">
                  {rowIndex + 1}
                </span>
                <div className="guess-name__text">
                  {localizedBuildingName(guess.id, guess.name, lang)}
                  {guess.nearMiss && (
                    <span className="guess-name__near-miss">{t('nearMiss')}</span>
                  )}
                </div>
              </div>
              <div className="guess-cells">
                {guess.cells.map((cell, cellIndex) => {
                  const note = localizedCellNote(cell, lang);
                  const sub = localizedCellSub(cell, lang);
                  return (
                    <div
                      className={`tile tile--${cell.status}`}
                      data-label={localizedAttributeLabel(cell.key, lang)}
                      key={cell.key}
                      role="img"
                      aria-label={note}
                      title={note}
                      style={{ '--i': cellIndex } as CSSProperties}
                    >
                      <span className="tile__value">{localizedCellValue(cell, lang)}</span>
                      {sub && <span className="tile__sub">{sub}</span>}
                      {cell.direction && (
                        <span className="tile__direction" aria-hidden="true">
                          {cell.direction === 'same'
                            ? '='
                            : cell.direction === 'older'
                              ? '↓'
                              : '↑'}{' '}
                          {cell.direction === 'same'
                            ? ''
                            : t(cell.direction === 'older' ? 'older' : 'newer')}
                        </span>
                      )}
                      <span className="tile__mark" aria-hidden="true">
                        {STATUS_MARK[cell.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
