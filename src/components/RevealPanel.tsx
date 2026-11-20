import { useEffect, useRef, useState } from 'react';
import type { Answer, Mode } from '../../shared/types';
import { flagEmoji, formatHeight } from '../format';
import { useI18n } from '../i18n/I18nProvider';
import { localizedAnswerContent } from '../i18n/display';
import { ArchMark, ArrowRightIcon, ShareIcon } from './Icon';
import { DailyCountdown } from './DailyCountdown';

interface RevealPanelProps {
  answer: Answer;
  status: 'won' | 'lost';
  attempts: number;
  mode: Mode;
  nextDailyAt?: string;
  shareMessage: string | null;
  onShare: () => void;
  onNewPractice: () => void;
  onPlayPractice: () => void;
  onNewDaily?: () => void;
}

export function RevealPanel({
  answer,
  status,
  attempts,
  mode,
  nextDailyAt,
  shareMessage,
  onShare,
  onNewPractice,
  onPlayPractice,
  onNewDaily,
}: RevealPanelProps) {
  const { lang, t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const image = answer.image;
  const content = localizedAnswerContent(answer, lang);
  const height = formatHeight(answer.heightM, lang);

  useEffect(() => {
    setImageFailed(false);
  }, [image?.src]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.focus({ preventScroll: true });
    section.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [answer.id, status]);

  return (
    <section
      className={`reveal reveal--${status}`}
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="reveal-title"
    >
      <div className="reveal__banner">
        <div>
          <p className="reveal__eyebrow">
            {status === 'won'
              ? t(attempts === 1 ? 'solvedOne' : 'solvedMany', { count: attempts })
              : t('outOfGuesses')}
          </p>
          <h2 className="reveal__title" id="reveal-title">
            {status === 'won' ? content.name : t('theBuildingWas', { name: content.name })}
          </h2>
        </div>
        <span className={`reveal__badge reveal__badge--${status}`} aria-hidden="true">
          {status === 'won' ? '✓' : <ArchMark size={22} />}
        </span>
      </div>

      <div className="reveal__body">
        <figure className="reveal__media">
          {image && !imageFailed ? (
            <img
              src={image.src}
              alt={t('photoOf', { name: content.name })}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="reveal__placeholder">
              <ArchMark size={58} />
              <span>{content.name}</span>
            </div>
          )}
          {image && !imageFailed && (
            <figcaption className="reveal__credit">
              {t('photo')}: {image.credit ?? 'Wikimedia Commons'}
              {image.license ? ` · ${image.license}` : ''}
              {image.pageUrl ? (
                <>
                  {' · '}
                  <a href={image.pageUrl} target="_blank" rel="noreferrer">
                    Wikimedia Commons
                  </a>
                </>
              ) : null}
            </figcaption>
          )}
        </figure>

        <div className="reveal__content">
          <p className="reveal__location">
            <span aria-hidden="true">{flagEmoji(answer.countryCode)}</span> {content.city},{' '}
            {content.country} <span className="reveal__dot">·</span> {content.continent}
          </p>
          <p className="reveal__blurb">{content.blurb}</p>

          <dl className="meta">
            <div className="meta__item">
              <dt>{t('attrBuilt')}</dt>
              <dd>{content.year}</dd>
              {content.yearNote && <p className="meta__note">{content.yearNote}</p>}
            </div>
            <div className="meta__item">
              <dt>{t('attrStyle')}</dt>
              <dd>{content.style}</dd>
            </div>
            <div className="meta__item">
              <dt>{t('attrType')}</dt>
              <dd>{content.type}</dd>
            </div>
            <div className="meta__item">
              <dt>{t('attrUse')}</dt>
              <dd>{content.use}</dd>
            </div>
            <div className="meta__item meta__item--wide">
              <dt>{t('materialsLabel')}</dt>
              <dd>{content.materials.join(' · ')}</dd>
            </div>
            <div className="meta__item meta__item--wide">
              <dt>{t(content.architects.length === 1 ? 'architectLabel' : 'architectsLabel')}</dt>
              <dd>{content.architects.join(' · ')}</dd>
            </div>
            {height && (
              <div className="meta__item">
                <dt>{t('heightLabel')}</dt>
                <dd>{height}</dd>
              </div>
            )}
          </dl>

          <div className="fact">
            <p className="fact__label">{t('didYouKnow')}</p>
            <p>{content.fact}</p>
          </div>

          <div className="reveal__actions">
            <button type="button" className="button button--primary" onClick={onShare}>
              <ShareIcon />
              {t('shareResult')}
            </button>
            <a
              className="button button--ghost"
              href={answer.wikiUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('wikipedia')}
            </a>
            {mode === 'practice' ? (
              <button type="button" className="button button--ghost" onClick={onNewPractice}>
                {t('nextBuilding')} <ArrowRightIcon />
              </button>
            ) : (
              <button type="button" className="button button--ghost" onClick={onPlayPractice}>
                {t('playPractice')}
              </button>
            )}
          </div>

          <div className="reveal__share-feedback" aria-live="polite">
            {shareMessage}
          </div>

          {mode === 'daily' && (
            <DailyCountdown nextDailyAt={nextDailyAt} onNewDaily={onNewDaily} />
          )}
        </div>
      </div>
    </section>
  );
}
