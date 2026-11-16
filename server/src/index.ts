import { existsSync } from 'node:fs';
import path from 'node:path';
import { app } from './app';
import { config } from './config';
import { buildings } from './data';
import { closeDatabase } from './db';
import { runMigrations } from './migrate';

const clientIndex = path.join(config.clientDirectory, 'index.html');
if (config.isProduction && !existsSync(clientIndex)) {
  console.warn('[warn] Client build not found. Run npm run build first.');
}

if (config.database.autoMigrate) {
  try {
    await runMigrations();
  } catch (error) {
    console.error('[db] migration failed', error);
    process.exit(1);
  }
} else {
  console.log('[db] automatic migrations are disabled (DB_AUTO_MIGRATE=false)');
}

const server = app.listen(config.port, () => {
  console.log(`Arqdle server listening on http://localhost:${config.port}`);
  console.log(
    `${buildings.length} buildings · daily epoch ${config.epoch} · time zone ${config.timezone}`,
  );
  console.log(
    config.google.enabled
      ? '[auth] Google sign-in is enabled'
      : '[auth] Google sign-in is disabled (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)',
  );
  if (config.admin.emails.length > 0 || config.admin.token) {
    console.log(
      `[admin] analytics enabled (${config.admin.emails.length} email(s)${
        config.admin.token ? ', bearer token' : ''
      })`,
    );
  } else {
    console.log('[admin] analytics disabled (set ADMIN_EMAILS or ADMIN_TOKEN)');
  }
  if (config.isProduction && !config.siteUrl) {
    console.warn('[warn] SITE_URL is not set. Canonical and Open Graph URLs are relative.');
  }
});

server.on('error', (error) => {
  console.error('[server]', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      void closeDatabase().finally(() => process.exit(0));
    });
  });
}
