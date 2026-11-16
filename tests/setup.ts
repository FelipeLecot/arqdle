const testUrl = process.env.TEST_DATABASE_URL?.trim();

if (testUrl) {
  let databaseName = '';
  try {
    databaseName = new URL(testUrl).pathname.replace(/^\//, '');
  } catch {
    throw new Error('TEST_DATABASE_URL is not a valid Postgres URL.');
  }
  if (!databaseName.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must point to a database whose name ends in _test.');
  }
  process.env.DATABASE_URL = testUrl;
  process.env.ADMIN_TOKEN ||= 'test-admin-token-1234';
  process.env.ADMIN_EMAILS ||= 'admin@example.com';
  process.env.WIKIMEDIA_IMAGES = 'off';
}
