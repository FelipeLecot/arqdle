export type HtmlLang = 'en' | 'es';

const META_BLOCK = /<!-- locale-meta:start -->[\s\S]*?<!-- locale-meta:end -->/;
const BOOT_BLOCK = /<!-- locale-boot:start -->[\s\S]*?<!-- locale-boot:end -->/;

/**
 * Pick the language for the static HTML shell. An explicit ?lang= wins. Without
 * it, use the best supported Accept-Language entry. Spanish is the default.
 */
export function resolveHtmlLang(
  queryLang: unknown,
  acceptLanguage: string | undefined,
): HtmlLang {
  const explicit = Array.isArray(queryLang) ? queryLang[0] : queryLang;
  if (typeof explicit === 'string') {
    const normalized = explicit.trim().toLowerCase();
    if (normalized === 'en' || normalized === 'es') return normalized;
  }

  const header = acceptLanguage ?? '';
  let best: { lang: HtmlLang; quality: number } | null = null;
  for (const part of header.split(',')) {
    const [tagPart, ...params] = part.trim().split(';');
    const base = tagPart.trim().toLowerCase().split('-')[0];
    if (base !== 'en' && base !== 'es') continue;

    let quality = 1;
    for (const param of params) {
      const [key, value] = param.trim().split('=');
      if (key === 'q') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) quality = parsed;
      }
    }
    if (quality <= 0) continue;
    if (!best || quality > best.quality) best = { lang: base, quality };
  }

  return best?.lang ?? 'es';
}

export function safeOrigin(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.origin;
  } catch {
    return '';
  }
}

function englishMeta(origin: string): string {
  const home = `${origin}/`;
  const english = `${origin}/?lang=en`;
  return `<!-- locale-meta:start -->
    <meta
      name="description"
      content="Arqdle is a free daily architecture guessing game. Guess the building in ten tries from clues about country, era, style, type, materials, architect and more. Play in English or Spanish."
    />
    <meta
      name="keywords"
      content="Arqdle, architecture game, daily architecture game, guess the building, architecture quiz, landmark game, Wordle architecture, building guessing game"
    />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="googlebot" content="index, follow" />
    <meta name="format-detection" content="telephone=no" />

    <link rel="canonical" href="${english}" />
    <link rel="alternate" hreflang="en" href="${english}" />
    <link rel="alternate" hreflang="es" href="${home}" />
    <link rel="alternate" hreflang="x-default" href="${home}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preconnect" href="https://thumb.wikimedia.org" crossorigin />
    <link rel="preconnect" href="https://upload.wikimedia.org" crossorigin />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Arqdle" />
    <meta property="og:title" content="Arqdle — Daily Architecture Guessing Game" />
    <meta
      property="og:description"
      content="Guess the building in ten tries. Compare eight clues about country, era, style, type, materials, architect and more. A new building every day."
    />
    <meta property="og:url" content="${english}" />
    <meta property="og:image" content="${origin}/og-image-en.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta
      property="og:image:alt"
      content="Arqdle — Guess the building. One landmark at a time."
    />
    <meta property="og:locale" content="en_US" />
    <meta property="og:locale:alternate" content="es_ES" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Arqdle — Daily Architecture Guessing Game" />
    <meta
      name="twitter:description"
      content="Guess the building in ten tries. Eight clues. A new building every day. English and Spanish."
    />
    <meta name="twitter:image" content="${origin}/og-image-en.png" />

    <title>Arqdle — Daily Architecture Guessing Game</title>

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "${home}#website",
            "url": "${home}",
            "name": "Arqdle",
            "description": "A free daily architecture guessing game. Guess the hidden building in ten tries from eight clues. English and Spanish.",
            "inLanguage": ["en", "es"]
          },
          {
            "@type": "WebApplication",
            "@id": "${home}#game",
            "name": "Arqdle",
            "alternateName": "Arqdle — daily architecture guessing game",
            "url": "${home}",
            "description": "Guess the hidden building in ten tries. Compare country, era, style, type, use, materials, architect and more. A new building every day.",
            "applicationCategory": "GameApplication",
            "applicationSubCategory": "Puzzle game",
            "operatingSystem": "Any",
            "browserRequirements": "Requires JavaScript",
            "inLanguage": ["en", "es"],
            "isAccessibleForFree": true,
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Person",
              "name": "Felipe Lecot",
              "url": "https://www.felipelecot.com"
            }
          }
        ]
      }
    </script>
    <!-- locale-meta:end -->`;
}

function englishBoot(): string {
  return `<!-- locale-boot:start -->
      <main class="boot">
        <div class="boot__brand" aria-hidden="true">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20V11a8 8 0 0 1 16 0v9" />
            <path d="M9 20v-7a3 3 0 0 1 6 0v7" />
            <path d="M2 20h20" />
          </svg>
        </div>
        <p class="boot__eyebrow">Daily architecture guessing game</p>
        <h1>Arqdle</h1>
        <p class="boot__lead">Guess the building of the day in ten tries.</p>
        <a class="boot__cta" href="/?mode=daily&amp;lang=en">Play</a>
        <p class="boot__note"><noscript>Turn on JavaScript to play.</noscript></p>
      </main>
      <!-- locale-boot:end -->`;
}

export function localizeHtml(html: string, lang: HtmlLang, origin: string): string {
  const safe = safeOrigin(origin);
  const localized = html.replaceAll('%SITE_URL%', safe);
  if (lang === 'es') return localized;

  return localized
    .replace('<html lang="es">', '<html lang="en">')
    .replace(META_BLOCK, englishMeta(safe))
    .replace(BOOT_BLOCK, englishBoot());
}
