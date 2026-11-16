import type { Me } from '../../shared/types';
import { useI18n } from '../i18n/I18nProvider';
import { AccountMenu } from './AccountMenu';
import { ArchMark, HelpIcon, StatsIcon } from './Icon';

interface HeaderProps {
  onHelp: () => void;
  onStats: () => void;
  me: Me | null;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  exportUrl: string;
}

export function Header({
  onHelp,
  onStats,
  me,
  onSignOut,
  onDeleteAccount,
  exportUrl,
}: HeaderProps) {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="header">
      <div className="header__inner">
        <div className="brand">
          <ArchMark className="brand__mark" />
          <h1 className="brand__name">ARQDLE</h1>
        </div>
        <nav className="header__actions" aria-label={t('gameInformation')}>
          <button
            type="button"
            className="icon-button lang-button"
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            aria-label={lang === 'en' ? t('switchToSpanish') : t('switchToEnglish')}
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <button type="button" className="icon-button" onClick={onHelp} aria-label={t('howToPlay')}>
            <HelpIcon />
            <span className="icon-button__label">{t('howToPlay')}</span>
          </button>
          <button type="button" className="icon-button" onClick={onStats} aria-label={t('stats')}>
            <StatsIcon />
            <span className="icon-button__label">{t('stats')}</span>
          </button>
          <AccountMenu
            me={me}
            onSignOut={onSignOut}
            onDeleteAccount={onDeleteAccount}
            exportUrl={exportUrl}
          />
        </nav>
      </div>
    </header>
  );
}
