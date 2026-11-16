import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  interpolate,
  translations,
  type Lang,
  type TranslationKey,
} from './translations';

const LANG_KEY = 'arqdle:v1:lang';

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param === 'es' || param === 'en') return param;
  } catch {
    // Ignore URL parsing errors.
  }
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch {
    // Ignore storage errors.
  }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Ignore storage errors.
    }
    const url = new URL(window.location.href);
    if (lang === 'es') url.searchParams.set('lang', 'es');
    else url.searchParams.delete('lang');
    window.history.replaceState({}, '', url);
  }, [lang]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      interpolate(translations[lang][key] ?? translations.en[key] ?? key, vars),
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
