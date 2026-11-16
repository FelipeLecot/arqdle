import { closeDatabase, query } from './db';

const days = Number(process.env.GUEST_RETENTION_DAYS ?? 90);
if (!Number.isInteger(days) || days < 1) {
  throw new Error(`Invalid GUEST_RETENTION_DAYS: ${process.env.GUEST_RETENTION_DAYS}`);
}

try {
  const result = await query<{ id: string }>(
    `DELETE FROM users u
      WHERE u.kind = 'guest'
        AND u.last_seen_at < now() - make_interval(days => $1)
        AND NOT EXISTS (SELECT 1 FROM games g WHERE g.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM daily_results r WHERE r.user_id = u.id)
      RETURNING u.id`,
    [days],
  );
  console.log(`Deleted ${result.rowCount ?? 0} empty guest profile(s) older than ${days} days.`);
} finally {
  await closeDatabase();
}
