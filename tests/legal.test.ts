import { describe, expect, it } from 'vitest';
import {
  LEGAL_CACHE_CONTROL,
  LEGAL_LAST_UPDATED,
  LEGAL_ROUTES,
  legalPath,
  renderLegalPage,
} from '../server/src/legal';

describe('legal pages', () => {
  it('maps the canonical paths for each language', () => {
    expect(legalPath('terms', 'es')).toBe('/legal/terms');
    expect(legalPath('terms', 'en')).toBe('/legal/en/terms');
    expect(legalPath('privacy', 'es')).toBe('/legal/privacy');
    expect(legalPath('privacy', 'en')).toBe('/legal/en/privacy');
    expect(LEGAL_ROUTES.map((route) => route.path)).toEqual([
      '/legal/terms',
      '/legal/en/terms',
      '/legal/privacy',
      '/legal/en/privacy',
    ]);
  });

  it('renders the Spanish terms with canonical and alternate links', () => {
    const html = renderLegalPage('terms', 'es', 'https://arqdle.com');
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<title>Arqdle — Términos del servicio</title>');
    expect(html).toContain('<h1>Términos del servicio</h1>');
    expect(html).toContain('Última actualización');
    expect(html).toContain(`datetime="${LEGAL_LAST_UPDATED}"`);
    expect(html).toContain('href="https://arqdle.com/legal/terms"');
    expect(html).toContain('href="https://arqdle.com/legal/en/terms"');
    expect(html).toContain('href="https://arqdle.com/legal/privacy"');
    expect(html).toContain('href="https://arqdle.com/"');
    expect(html).not.toContain('%SITE_URL%');
  });

  it('renders the English privacy policy', () => {
    const html = renderLegalPage('privacy', 'en', 'https://arqdle.com');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Arqdle — Privacy Policy</title>');
    expect(html).toContain('<h1>Privacy Policy</h1>');
    expect(html).toContain('Last updated');
    expect(html).toContain('href="https://arqdle.com/legal/en/privacy"');
    expect(html).toContain('href="https://arqdle.com/legal/privacy"');
    expect(html).toContain('href="https://arqdle.com/?lang=en"');
    expect(html).toContain('href="https://arqdle.com/legal/en/terms"');
  });

  it('names the analytics tools in the privacy policy', () => {
    for (const lang of ['es', 'en'] as const) {
      const html = renderLegalPage('privacy', lang, 'https://arqdle.com');
      expect(html).toContain('GTM-WR9Z3FTC');
      expect(html).toContain('G-LMKYBP3V0R');
    }
  });

  it('falls back to relative URLs when the origin is invalid', () => {
    const html = renderLegalPage('terms', 'en', 'javascript:alert(1)');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/en/terms"');
    expect(html).not.toContain('javascript:alert(1)');
  });

  it('keeps a long CDN cache lifetime', () => {
    expect(LEGAL_CACHE_CONTROL).toContain('public');
    expect(LEGAL_CACHE_CONTROL).toContain('max-age=2592000');
  });
});
