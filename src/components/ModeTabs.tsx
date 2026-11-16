import type { Mode } from '../../shared/types';
import { useI18n } from '../i18n/I18nProvider';

interface ModeTabsProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  const { t } = useI18n();

  return (
    <div className="mode-tabs" role="group" aria-label={t('gameMode')}>
      <button
        type="button"
        className="mode-tab"
        aria-pressed={mode === 'daily'}
        onClick={() => onChange('daily')}
      >
        {t('daily')}
      </button>
      <button
        type="button"
        className="mode-tab"
        aria-pressed={mode === 'practice'}
        onClick={() => onChange('practice')}
      >
        {t('practice')}
      </button>
    </div>
  );
}
