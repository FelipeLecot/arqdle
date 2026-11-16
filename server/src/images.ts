import type { AnswerImage } from '../../shared/types';

const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 10 * 60 * 1000;
const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT?.trim() ||
  'Arqdle/1.0 (self-hosted architecture guessing game)';
const MIN_REQUEST_INTERVAL_MS = 300;
const BAD_FILE_PATTERN =
  /logo|wordmark|(?:^|[_\s-])map(?:[_\s-]|$)|diagram|(?:^|[_\s-])plan(?:[_\s-]|$)|seal|coat[_\s-]?of[_\s-]?arms|icon|flag|locator|montage|collage|drawing|sketch|blueprint|poster|stamp|banner|emblem|symbol|chart|graph|signature|construction/i;
const PHOTO_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

interface CacheEntry {
  value: AnswerImage | undefined;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

interface MediaListResponse {
  items?: Array<{
    title?: string;
    type?: string;
  }>;
}

interface PageImageResponse {
  query?: {
    pages?: Array<{
      pageimage?: string;
      missing?: boolean;
    }>;
  };
}

interface CommonsResponse {
  query?: {
    pages?: Array<{
      missing?: boolean;
      imageinfo?: Array<{
        thumburl?: string;
        url?: string;
        descriptionurl?: string;
        extmetadata?: Record<string, { value?: string }>;
      }>;
    }>;
  };
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function plainText(value: string | undefined): string {
  if (!value) return '';
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function shorten(value: string, max = 110): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let requestQueue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function scheduleRequest<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait > 0) await sleep(wait);
    try {
      return await task();
    } finally {
      lastRequestAt = Date.now();
    }
  });
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function fetchJson<T>(url: string): Promise<T> {
  return scheduleRequest(async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status === 429 && attempt === 0) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1_000, 3_000)
          : 1_200;
        await sleep(delay);
        continue;
      }
      if (!response.ok) {
        throw new Error(`Wikimedia request failed with HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    }
    throw new Error('Wikimedia request was rate limited');
  });
}

function validImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    if (
      url.hostname !== 'wikimedia.org' &&
      !url.hostname.endsWith('.wikimedia.org')
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function commonsFileTitle(fileName: string): string {
  const clean = fileName.startsWith('File:') ? fileName : `File:${fileName}`;
  return clean.replace(/_/g, ' ');
}

async function lookupCommonsFile(
  fileName: string,
  name: string,
): Promise<AnswerImage | undefined> {
  const commonsUrl = new URL('https://commons.wikimedia.org/w/api.php');
  commonsUrl.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1400',
    titles: commonsFileTitle(fileName),
  }).toString();

  const data = await fetchJson<CommonsResponse>(commonsUrl.toString());
  const page = data.query?.pages?.[0];
  if (page?.missing) return undefined;
  const info = page?.imageinfo?.[0];
  const src = validImageUrl(info?.thumburl ?? info?.url);
  if (!info || !src) return undefined;

  const artist = plainText(info.extmetadata?.Artist?.value);
  const credit = plainText(info.extmetadata?.Credit?.value);
  const license = plainText(info.extmetadata?.LicenseShortName?.value);

  return {
    src,
    alt: `Photograph of ${name}`,
    credit: shorten(artist || credit || 'Wikimedia Commons contributor'),
    license: license || 'See file page',
    pageUrl: info.descriptionurl,
  };
}

async function candidateFiles(wikiTitle: string): Promise<string[]> {
  const title = wikiTitle.replace(/ /g, '_');
  const mediaUrl = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`;
  let items: NonNullable<MediaListResponse['items']> = [];
  try {
    const media = await fetchJson<MediaListResponse>(mediaUrl);
    items = media.items ?? [];
  } catch {
    items = [];
  }

  const images = items
    .filter((item) => item.type === 'image' && typeof item.title === 'string')
    .map((item) => item.title as string)
    .filter((file) => PHOTO_EXTENSIONS.test(file) && !BAD_FILE_PATTERN.test(file));

  const preferred = images.filter((file) => !/construction/i.test(file));
  const chosen = preferred.length > 0 ? preferred : images;
  if (chosen.length > 0) return [...new Set(chosen)].slice(0, 6);

  // Some articles have no usable page media. The lead image is a last resort.
  const pageUrl = new URL('https://en.wikipedia.org/w/api.php');
  pageUrl.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    prop: 'pageimages',
    piprop: 'name',
    titles: wikiTitle,
  }).toString();
  const pageData = await fetchJson<PageImageResponse>(pageUrl.toString());
  const lead = pageData.query?.pages?.[0]?.pageimage;
  if (
    lead &&
    PHOTO_EXTENSIONS.test(lead) &&
    !BAD_FILE_PATTERN.test(lead) &&
    !/construction/i.test(lead)
  ) {
    return [lead];
  }

  return [];
}

async function lookupImage(wikiTitle: string, name: string): Promise<AnswerImage | undefined> {
  const files = await candidateFiles(wikiTitle);
  for (const file of files) {
    try {
      const image = await lookupCommonsFile(file, name);
      if (image) return image;
    } catch {
      // Try the next image in the article.
    }
  }
  return undefined;
}

export async function getWikipediaImage(
  wikiTitle: string,
  name: string,
): Promise<AnswerImage | undefined> {
  if (process.env.WIKIMEDIA_IMAGES === 'off') return undefined;
  const cached = cache.get(wikiTitle);
  if (cached && cached.expires > Date.now()) return cached.value;

  try {
    const image = await lookupImage(wikiTitle, name);
    cache.set(wikiTitle, { value: image, expires: Date.now() + SUCCESS_TTL_MS });
    return image;
  } catch (error) {
    console.warn(`[image] ${wikiTitle}: ${(error as Error).message}`);
    cache.set(wikiTitle, { value: undefined, expires: Date.now() + FAILURE_TTL_MS });
    return undefined;
  }
}
