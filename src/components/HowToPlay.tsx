import { useI18n } from '../i18n/I18nProvider';
import {
  localizedCentury,
  localizedContinent,
  localizedCountryName,
  localizedStyle,
} from '../i18n/display';
import { Modal } from './Modal';

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

export function HowToPlay({ open, onClose }: HowToPlayProps) {
  const { lang, t } = useI18n();

  return (
    <Modal open={open} onClose={onClose} title={t('howToPlay')}>
      <div className="prose">
        <p>{t('howToIntro')}</p>

        <div className="example" aria-label={t('exampleResult')}>
          <div className="example__row">
            <div className="example-tile example-tile--green">
              <span className="example-tile__label">{t('attrContinent')}</span>
              <span className="example-tile__value">
                {localizedContinent('Europe', lang)}
              </span>
              <span className="example-tile__mark" aria-hidden="true">
                ✓
              </span>
            </div>
            <div className="example-tile example-tile--green">
              <span className="example-tile__label">{t('attrCountry')}</span>
              <span className="example-tile__value">{localizedCountryName('Italy', lang)}</span>
              <span className="example-tile__mark" aria-hidden="true">
                ✓
              </span>
            </div>
            <div className="example-tile example-tile--yellow">
              <span className="example-tile__label">{t('attrBuilt')}</span>
              <span className="example-tile__value">1889</span>
              <span className="example-tile__sub">{localizedCentury('19th c.', lang)}</span>
              <span className="example-tile__direction" aria-hidden="true">
                ↓ {t('older')}
              </span>
            </div>
            <div className="example-tile example-tile--red">
              <span className="example-tile__label">{t('attrStyle')}</span>
              <span className="example-tile__value">{localizedStyle('Gothic', lang)}</span>
              <span className="example-tile__mark" aria-hidden="true">
                ✕
              </span>
            </div>
          </div>
        </div>

        <div className="rules">
          <div className="rule">
            <span className="swatch swatch--green" aria-hidden="true" />
            <div>{t('ruleGreen')}</div>
          </div>
          <div className="rule">
            <span className="swatch swatch--yellow" aria-hidden="true" />
            <div>{t('ruleYellow')}</div>
          </div>
          <div className="rule">
            <span className="swatch swatch--red" aria-hidden="true" />
            <div>{t('ruleRed')}</div>
          </div>
        </div>

        <p>{t('builtArrowHelp')}</p>
        <p>{t('dailyPracticeHelp')}</p>

        <button type="button" className="button button--primary button--full" onClick={onClose}>
          {t('startGuessing')}
        </button>
      </div>
    </Modal>
  );
}
