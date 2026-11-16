import type { Answer, AnswerImage } from '../../shared/types';
import { formatYear } from './compare';
import type { Building } from './types';

export function toAnswer(building: Building, image?: AnswerImage): Answer {
  const wikiTitle = building.wikiTitle.replace(/ /g, '_');
  return {
    id: building.id,
    name: building.name,
    city: building.city,
    country: building.country,
    countryCode: building.countryCode,
    continent: building.continent,
    year: building.year,
    yearLabel: formatYear(building.year),
    yearNote: building.yearNote,
    style: building.style,
    type: building.type,
    use: building.use,
    materials: building.materials,
    architects: building.architects,
    heightM: building.heightM,
    blurb: building.blurb,
    fact: building.fact,
    wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`,
    image,
  };
}
