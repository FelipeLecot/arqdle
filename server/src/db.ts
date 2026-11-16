import pg from 'pg';
import { config } from './config';

if (!config.database.url) {
  throw new Error(
    'DATABASE_URL is required. Start Postgres with "docker compose up -d db" and copy .env.example to .env.',
  );
}

// Keep DATE columns as YYYY-MM-DD strings. The default parser returns a Date
// in local time, which can shift the puzzle date around midnight.
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  application_name: 'arqdle',
});

pool.on('error', (error) => {
  console.error('[db] idle client error', error);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The connection may already be gone.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === '57P01' ||
    code === '57P02' ||
    code === '57P03' ||
    code === '53300'
  );
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
