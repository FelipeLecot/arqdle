import type { Answer, AttributeKey, Direction, GuessCell } from '../../shared/types';
import {
  attributeTranslationKey,
  translations,
  type Lang,
} from './translations';
import {
  buildingEs,
  continentsEs,
  countriesEs,
  formFamiliesEs,
  materialsEs,
  stylesEs,
  typesEs,
  usesEs,
} from './esData';

function translated(
  map: Record<string, string>,
  value: string,
  lang: Lang,
): string {
  return lang === 'es' ? (map[value] ?? value) : value;
}

export function localizedBuildingName(id: string, fallback: string, lang: Lang): string {
  return lang === 'es' ? (buildingEs[id]?.name ?? fallback) : fallback;
}

export function localizedAliases(id: string, lang: Lang): string[] {
  return lang === 'es' ? (buildingEs[id]?.aliases ?? []) : [];
}

export function localizedCity(id: string, fallback: string, lang: Lang): string {
  return lang === 'es' ? (buildingEs[id]?.city ?? fallback) : fallback;
}

export function localizedCountryName(country: string, lang: Lang): string {
  return translated(countriesEs, country, lang);
}

export function localizedContinent(continent: string, lang: Lang): string {
  return translated(continentsEs, continent, lang);
}

export function localizedStyle(style: string, lang: Lang): string {
  return translated(stylesEs, style, lang);
}

export function localizedType(type: string, lang: Lang): string {
  return translated(typesEs, type, lang);
}

export function localizedUse(use: string, lang: Lang): string {
  return translated(usesEs, use, lang);
}

export function localizedFormFamily(family: string, lang: Lang): string {
  return translated(formFamiliesEs, family, lang);
}

export function localizedMaterial(material: string, lang: Lang): string {
  return translated(materialsEs, material, lang);
}

export function localizedMaterials(materials: string[], lang: Lang): string[] {
  return materials.map((material) => localizedMaterial(material, lang));
}

export function localizedArchitect(architect: string, lang: Lang): string {
  if (lang === 'es' && architect === 'Unknown') return 'Desconocido';
  return architect;
}

export function localizedArchitects(architects: string[], lang: Lang): string[] {
  return architects.map((architect) => localizedArchitect(architect, lang));
}

export function localizedAttributeLabel(key: AttributeKey, lang: Lang): string {
  return translations[lang][attributeTranslationKey[key]];
}

export function formatYear(year: number, lang: Lang): string {
  if (year < 0) return `${Math.abs(year)} ${lang === 'es' ? 'a. C.' : 'BC'}`;
  return String(year);
}

function romanNumeral(value: number): string {
  const table: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of table) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

export function localizedCentury(sub: string, lang: Lang): string {
  if (lang === 'en') return sub;
  const match = /^(\d+)(?:st|nd|rd|th) c\.( BC)?$/.exec(sub);
  if (!match) return sub;
  const century = romanNumeral(Number(match[1]));
  return `s. ${century}${match[2] ? ' a. C.' : ''}`;
}

export function localizedYearValue(value: string, lang: Lang): string {
  if (lang === 'en') return value;
  const match = /^(\d+) BC$/.exec(value);
  return match ? `${match[1]} a. C.` : value;
}

function localizedCountryValue(value: string, lang: Lang): string {
  if (lang === 'en') return value;
  const separator = value.indexOf(' ');
  if (separator < 0) return localizedCountryName(value, lang);
  const flag = value.slice(0, separator);
  const country = value.slice(separator + 1);
  return `${flag} ${localizedCountryName(country, lang)}`;
}

export function localizedCellValue(cell: GuessCell, lang: Lang): string {
  if (lang === 'en') return cell.value;
  switch (cell.key) {
    case 'continent':
      return localizedContinent(cell.value, lang);
    case 'country':
      return localizedCountryValue(cell.value, lang);
    case 'built':
      return localizedYearValue(cell.value, lang);
    case 'style':
      return localizedStyle(cell.value, lang);
    case 'type':
      return localizedType(cell.value, lang);
    case 'use':
      return localizedUse(cell.value, lang);
    case 'material':
      return cell.value
        .split(' · ')
        .map((material) => localizedMaterial(material, lang))
        .join(' · ');
    case 'architect':
      return cell.value
        .split(' · ')
        .map((architect) => localizedArchitect(architect, lang))
        .join(' · ');
  }
}

export function localizedCellSub(cell: GuessCell, lang: Lang): string | undefined {
  if (!cell.sub) return undefined;
  if (lang === 'en') return cell.sub;
  if (cell.key === 'built') return localizedCentury(cell.sub, lang);
  if (cell.key === 'type') return localizedFormFamily(cell.sub, lang);
  if (cell.sub === 'same family') return 'misma familia';
  if (cell.sub === 'shares one') return 'comparte uno';
  return cell.sub;
}

export function localizedDirection(direction: Direction, lang: Lang): string {
  if (lang === 'en') return direction;
  return direction === 'older' ? 'más antigua' : 'más reciente';
}

export function localizedCellNote(cell: GuessCell, lang: Lang): string {
  if (lang === 'en') return cell.note;

  const label = localizedAttributeLabel(cell.key, lang);
  const value = localizedCellValue(cell, lang);
  const sub = localizedCellSub(cell, lang);
  const exact = cell.status === 'green';
  const close = cell.status === 'yellow';
  const direction =
    cell.direction === 'older'
      ? ' La respuesta es más antigua.'
      : cell.direction === 'newer'
        ? ' La respuesta es más reciente.'
        : '';

  switch (cell.key) {
    case 'continent':
      return `${label}: ${value}. ${
        exact ? 'Coincidencia exacta.' : 'La respuesta está en otro continente.'
      }`;
    case 'country':
      return `${label}: ${value}. ${
        exact ? 'Coincidencia exacta.' : 'La respuesta está en otro país.'
      }`;
    case 'built':
      return `${label}: ${value}${sub ? ` (${sub})` : ''}. ${
        exact
          ? 'Mismo siglo que la respuesta.'
          : close
            ? 'Está cerca del siglo de la respuesta.'
            : 'Está lejos del siglo de la respuesta.'
      }${direction}`;
    case 'style':
      return `${label}: ${value}. ${
        exact
          ? 'Coincidencia exacta.'
          : close
            ? 'Está en la misma familia de estilos que la respuesta.'
            : 'No coincide.'
      }`;
    case 'type':
      return `${label}: ${value}. ${
        exact
          ? 'Coincidencia exacta.'
          : close
            ? `Está en la misma familia de formas que la respuesta${
                sub ? ` (${sub})` : ''
              }.`
            : 'No coincide.'
      }`;
    case 'use':
      return `${label}: ${value}. ${
        exact ? 'Coincidencia exacta.' : 'La respuesta tiene otro uso.'
      }`;
    case 'material':
      return `${label}: ${value}. ${
        exact
          ? 'Mismo material principal.'
          : close
            ? 'Comparte material o familia de materiales con la respuesta.'
            : 'No coincide.'
      }`;
    case 'architect':
      return `${label}: ${value}. ${
        exact
          ? 'Coincidencia exacta.'
          : close
            ? 'Comparte al menos un arquitecto con la respuesta.'
            : 'No coincide.'
      }`;
  }
}

export interface BuildingCopyLike {
  name: string;
  city: string;
  blurb: string;
  fact: string;
  yearNote?: string;
}

export function localizedBuildingCopy(
  building: BuildingCopyLike & { id: string },
  lang: Lang,
): BuildingCopyLike {
  if (lang === 'en') {
    return {
      name: building.name,
      city: building.city,
      blurb: building.blurb,
      fact: building.fact,
      yearNote: building.yearNote,
    };
  }
  const spanish = buildingEs[building.id];
  return {
    name: spanish?.name ?? building.name,
    city: spanish?.city ?? building.city,
    blurb: spanish?.blurb ?? building.blurb,
    fact: spanish?.fact ?? building.fact,
    yearNote: spanish?.yearNote ?? building.yearNote,
  };
}

export function localizedAnswerContent(
  answer: Answer,
  lang: Lang,
): {
  name: string;
  city: string;
  country: string;
  continent: string;
  year: string;
  yearNote?: string;
  style: string;
  type: string;
  use: string;
  materials: string[];
  architects: string[];
  blurb: string;
  fact: string;
} {
  const copy = localizedBuildingCopy(answer, lang);
  return {
    name: copy.name,
    city: copy.city,
    country: localizedCountryName(answer.country, lang),
    continent: localizedContinent(answer.continent, lang),
    year: formatYear(answer.year, lang),
    yearNote: copy.yearNote,
    style: localizedStyle(answer.style, lang),
    type: localizedType(answer.type, lang),
    use: localizedUse(answer.use, lang),
    materials: localizedMaterials(answer.materials, lang),
    architects: localizedArchitects(answer.architects, lang),
    blurb: copy.blurb,
    fact: copy.fact,
  };
}
