import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { localizeHtml, resolveHtmlLang } from '../server/src/html';

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('static HTML language', () => {
  it('prefers an explicit ?lang value', () => {
    expect(resolveHtmlLang('en', 'es-ES,es;q=0.9')).toBe('en');
    expect(resolveHtmlLang('es', 'en-US,en;q=0.9')).toBe('es');
    expect(resolveHtmlLang(['en', 'es'], undefined)).toBe('en');
  });

  it('uses the best supported Accept-Language entry', () => {
    expect(resolveHtmlLang(undefined, 'en-US,en;q=0.9,es;q=0.8')).toBe('en');
    expect(resolveHtmlLang(undefined, 'es-MX,es;q=0.9,en;q=0.4')).toBe('es');
    expect(resolveHtmlLang(undefined, 'fr-FR,fr;q=0.9')).toBe('es');
    expect(resolveHtmlLang(undefined, 'en;q=0,es;q=0.5')).toBe('es');
    expect(resolveHtmlLang(undefined, undefined)).toBe('es');
  });

  it('keeps the Spanish shell by default', () => {
    const html = localizeHtml(source, 'es', 'https://arqdle.com');
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('Adivina el edificio del día en diez intentos.');
    expect(html).toContain('content="https://arqdle.com/og-image.png"');
  });

  it('renders the English shell and banner for ?lang=en', () => {
    const html = localizeHtml(source, 'en', 'https://arqdle.com');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Guess the building of the day in ten tries.');
    expect(html).toContain('content="https://arqdle.com/og-image-en.png"');
    expect(html).toContain('content="https://arqdle.com/?lang=en"');
    expect(html).toContain('"inLanguage": ["en", "es"]');
    expect(html).not.toContain('Adivina el edificio del día en diez intentos.');
  });

  it('falls back to relative URLs when the origin is invalid', () => {
    const html = localizeHtml(source, 'en', 'javascript:alert(1)');
    expect(html).toContain('content="/og-image-en.png"');
    expect(html).not.toContain('javascript:alert(1)');
  });
});
