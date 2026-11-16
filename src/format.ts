import type { Lang } from './i18n/translations';

export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65),
    );
}

export function formatHeight(heightM: number | undefined, lang: Lang = 'en'): string | null {
  if (!heightM || !Number.isFinite(heightM)) return null;
  const rounded = Math.round(heightM * 10) / 10;
  return `${rounded.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')} m`;
}

export function padDay(dayNumber: number | undefined): string {
  return String(dayNumber ?? 0).padStart(3, '0');
}

export function formatDateLabel(dateKey: string, lang: Lang): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
