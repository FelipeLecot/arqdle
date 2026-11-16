import crypto from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config';
import { pool } from './db';

const MIGRATION_LOCK = 1_634_230_628;

interface AppliedMigration {
  version: string;
  checksum: string;
}

export async function runMigrations(): Promise<void> {
  const directory = config.database.migrationsDirectory;
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No SQL migrations found in ${directory}`);
  }

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const result = await client.query<AppliedMigration>(
      'SELECT version, checksum FROM schema_migrations',
    );
    const applied = new Map(result.rows.map((row) => [row.version, row.checksum]));
    let count = 0;

    for (const file of files) {
      const sql = await readFile(path.join(directory, file), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const previous = applied.get(file);

      if (previous !== undefined) {
        if (previous !== checksum) {
          throw new Error(
            `Migration ${file} changed after it was applied. Add a new migration instead.`,
          );
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [file, checksum],
        );
        await client.query('COMMIT');
        count += 1;
        console.log(`[db] applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    if (count === 0) console.log('[db] schema is up to date');
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK]);
    } catch {
      // The connection may already be gone.
    }
    client.release();
  }
}
