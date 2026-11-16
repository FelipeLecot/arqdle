export const CONTINENTS = [
  'Europe',
  'Asia',
  'Africa',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
] as const;

export type Continent = (typeof CONTINENTS)[number];

export const STYLE_FAMILIES = [
  'Ancient',
  'Classical',
  'Medieval',
  'Islamic',
  'Asian Traditional',
  'Pre-Columbian',
  'Early Modern',
  'High Modern',
  'Contemporary',
  'Vernacular',
] as const;

export type StyleFamily = (typeof STYLE_FAMILIES)[number];

export const FORM_FAMILIES = [
  'Religious',
  'Funerary',
  'Commemorative',
  'Residential',
  'Governmental',
  'Commercial',
  'High-rise',
  'Cultural',
  'Educational',
  'Spectacle',
  'Fortification',
  'Infrastructure',
  'Transport',
  'Tower',
  'Settlement',
  'Ceremonial',
  'Research',
] as const;

export type FormFamily = (typeof FORM_FAMILIES)[number];

export const USE_CATEGORIES = [
  'Religious',
  'Funerary',
  'Commemorative',
  'Residential',
  'Governmental',
  'Commercial',
  'Cultural',
  'Educational',
  'Entertainment',
  'Defensive',
  'Infrastructure',
  'Tourism',
  'Mixed use',
  'Research',
  'Ceremonial',
  'Transport',
] as const;

export type UseCategory = (typeof USE_CATEGORIES)[number];

export interface Building {
  id: string;
  name: string;
  aliases?: string[];
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2 code, used for the flag. */
  countryCode: string;
  continent: Continent;
  /** Signed year. Negative values are BC. */
  year: number;
  yearNote?: string;
  style: string;
  styleFamily: StyleFamily;
  /** Specific building form, for example Cathedral or Skyscraper. */
  type: string;
  formFamily: FormFamily;
  use: UseCategory;
  /** Most important material first. */
  materials: string[];
  architects: string[];
  heightM?: number;
  blurb: string;
  fact: string;
  /** English Wikipedia article title. */
  wikiTitle: string;
}
