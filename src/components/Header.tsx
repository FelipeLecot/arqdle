import { useI18n } from '../i18n/I18nProvider';
import { ArchMark, HelpIcon, StatsIcon } from './Icon';

interface HeaderProps {
  onHelp: () => void;
  onStats: () => void;
}

export function Header({ onHelp, onStats }: HeaderProps) {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="header">
      <div className="header__inner">
        <div className="brand">
          <ArchMark className="brand__mark" />
          <h1 className="brand__name">ARCHDLE</h1>
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
        </nav>
      </div>
    </header>
  );
}
