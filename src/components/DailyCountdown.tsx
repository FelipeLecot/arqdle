import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

interface DailyCountdownProps {
  nextDailyAt?: string;
  onNewDaily?: () => void;
}

function remainingMs(nextDailyAt?: string): number {
  if (!nextDailyAt) return 0;
  const target = Date.parse(nextDailyAt);
  return Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function DailyCountdown({ nextDailyAt, onNewDaily }: DailyCountdownProps) {
  const { t } = useI18n();
  const [remaining, setRemaining] = useState(() => remainingMs(nextDailyAt));

  useEffect(() => {
    setRemaining(remainingMs(nextDailyAt));
    if (!nextDailyAt) return;
    const timer = window.setInterval(() => setRemaining(remainingMs(nextDailyAt)), 1000);
    return () => window.clearInterval(timer);
  }, [nextDailyAt]);

  if (!nextDailyAt) return null;

  const ready = remaining <= 0;
  const clock = formatClock(remaining);

  return (
    <div
      className="countdown"
      role="timer"
      aria-label={ready ? t('newDailyReady') : `${t('newDailyInLabel')} ${clock}`}
    >
      {ready ? (
        <div className="countdown__ready" aria-live="polite">
          <span>{t('newDailyReady')}</span>
          {onNewDaily && (
            <button type="button" className="button countdown__button" onClick={onNewDaily}>
              {t('loadNewDaily')}
            </button>
          )}
        </div>
      ) : (
        <div className="countdown__line">
          <span className="countdown__label">{t('newDailyInLabel')}</span>
          <span className="countdown__time">{clock}</span>
        </div>
      )}
    </div>
  );
}
