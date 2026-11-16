import { closeDatabase } from './db';
import { runMigrations } from './migrate';

try {
  await runMigrations();
  console.log('Migrations complete.');
} catch (error) {
  console.error('[db] migration failed', error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
