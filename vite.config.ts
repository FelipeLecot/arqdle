import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.PORT || '3001';
  const siteUrl = (env.SITE_URL || '').trim().replace(/\/+$/, '');
  const hreflangLinks = siteUrl
    ? [
        `<link rel="alternate" hreflang="en" href="${siteUrl}/?lang=en" />`,
        `<link rel="alternate" hreflang="es" href="${siteUrl}/" />`,
        `<link rel="alternate" hreflang="x-default" href="${siteUrl}/" />`,
      ].join('\n    ')
    : '';

  // Load Google Tag Manager only in production builds, so local development
  // does not send analytics events. The standard loader pushes gtm.start and
  // the gtm.js event that page-view triggers need. The container config loads GA4.
  const analytics =
    mode === 'production'
      ? `<!-- Google Tag Manager -->
    <script>
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var f = d.getElementsByTagName(s)[0];
        var j = d.createElement(s);
        var dl = l !== 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', 'GTM-WR9Z3FTC');
    </script>
    <!-- End Google Tag Manager -->`
      : '';

  return {
    plugins: [
      react(),
      {
        name: 'site-url-metadata',
        transformIndexHtml(html) {
          return html
            .replaceAll('%SITE_URL%', siteUrl)
            .replace('<!-- HREFLANG_LINKS -->', hreflangLinks)
            .replace('<!-- ANALYTICS -->', analytics);
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': `http://localhost:${apiPort}`,
        '/legal': `http://localhost:${apiPort}`,
        '/terms': `http://localhost:${apiPort}`,
        '/privacy': `http://localhost:${apiPort}`,
        '/en/terms': `http://localhost:${apiPort}`,
        '/en/privacy': `http://localhost:${apiPort}`,
      },
    },
    build: {
      outDir: 'dist/client',
      emptyOutDir: true,
    },
  };
});
