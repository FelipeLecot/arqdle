import { existsSync } from 'node:fs';
import path from 'node:path';
import { app } from './app';
import { config } from './config';
import { buildings } from './data';

const clientIndex = path.join(config.clientDirectory, 'index.html');
if (config.isProduction && !existsSync(clientIndex)) {
  console.warn('[warn] Client build not found. Run npm run build first.');
}

const server = app.listen(config.port, () => {
  console.log(`Archdle server listening on http://localhost:${config.port}`);
  console.log(
    `${buildings.length} buildings · daily epoch ${config.epoch} · time zone ${config.timezone}`,
  );
  if (config.secretWasGenerated) {
    console.warn(
      config.isProduction
        ? '[warn] PUZZLE_SECRET is not set. Using a random secret; saved games will not survive a restart.'
        : '[dev] PUZZLE_SECRET is not set. Using the development secret.',
    );
  }
});

server.on('error', (error) => {
  console.error('[server]', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
