import type { Stats } from '../../shared/types';
import { useI18n } from '../i18n/I18nProvider';
import { Modal } from './Modal';

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  stats: Stats;
}

export function StatsModal({ open, onClose, stats }: StatsModalProps) {
  const { t } = useI18n();
  const winPercent = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
  const max = Math.max(...stats.distribution, 1);

  return (
    <Modal open={open} onClose={onClose} title={t('stats')}>
      <div className="stats-grid">
        <div className="stat">
          <span className="stat__value">{stats.played}</span>
          <span className="stat__label">{t('statsPlayed')}</span>
        </div>
        <div className="stat">
          <span className="stat__value">{winPercent}%</span>
          <span className="stat__label">{t('statsWinRate')}</span>
        </div>
        <div className="stat">
          <span className="stat__value">{stats.currentStreak}</span>
          <span className="stat__label">{t('statsCurrentStreak')}</span>
        </div>
        <div className="stat">
          <span className="stat__value">{stats.maxStreak}</span>
          <span className="stat__label">{t('statsMaxStreak')}</span>
        </div>
      </div>

      <h3 className="stats__subtitle">{t('statsDistribution')}</h3>
      <p className="stats__note">{t('statsDailyOnly')}</p>

      <div className="distribution" aria-label={t('statsDistribution')}>
        {stats.distribution.map((count, index) => (
          <div className="dist-row" key={index}>
            <span className="dist-row__label">{index + 1}</span>
            <div className="dist-row__track">
              {count > 0 && (
                <div
                  className="dist-row__bar"
                  style={{ width: `${(count / max) * 100}%` }}
                >
                  {count}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {stats.played === 0 && <p className="stats__empty">{t('statsEmpty')}</p>}

      <button type="button" className="button button--ghost button--full" onClick={onClose}>
        {t('close')}
      </button>
    </Modal>
  );
}
