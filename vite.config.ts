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

  return {
    plugins: [
      react(),
      {
        name: 'site-url-metadata',
        transformIndexHtml(html) {
          return html
            .replaceAll('%SITE_URL%', siteUrl)
            .replace('<!-- HREFLANG_LINKS -->', hreflangLinks);
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
