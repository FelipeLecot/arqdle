import type { BuildingOption } from '../shared/types';
import {
  localizedAliases,
  localizedBuildingName,
  localizedCity,
  localizedCountryName,
} from './i18n/display';

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’.,()]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

export function optionNames(option: BuildingOption, lang: 'en' | 'es'): string[] {
  return [
    option.name,
    localizedBuildingName(option.id, option.name, lang),
    localizedBuildingName(option.id, option.name, 'es'),
    ...(option.aliases ?? []),
    ...localizedAliases(option.id, lang),
    ...localizedAliases(option.id, 'es'),
  ];
}

export function optionHint(option: BuildingOption, lang: 'en' | 'es'): string {
  if (!option.city || !option.country) return option.hint;
  const city = localizedCity(option.id, option.city, lang);
  const country = localizedCountryName(option.country, lang);
  return city === country ? city : `${city}, ${country}`;
}

/**
 * Search order: building name or architect, then city hint.
 * Country is deliberately not searchable.
 */
export function scoreOption(
  option: BuildingOption,
  query: string,
  lang: 'en' | 'es',
): number {
  const names = optionNames(option, lang).map(normalize);
  const architects = (option.architects ?? [])
    .filter((name) => name.toLowerCase() !== 'unknown')
    .map(normalize);
  const city = normalize(localizedCity(option.id, option.city, lang));
  if (names.some((name) => name.startsWith(query))) return 0;
  if (architects.some((name) => name.startsWith(query))) return 0;
  if (names.some((name) => name.includes(query))) return 1;
  if (architects.some((name) => name.includes(query))) return 1;
  if (city.includes(query)) return 2;
  return Number.POSITIVE_INFINITY;
}
