const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data', 'db');
const pidFile = path.join(dbDir, 'postmaster.pid');

if (fs.existsSync(pidFile)) {
  try {
    fs.unlinkSync(pidFile);
  } catch (e) {
    // ignore
  }
}

const pg = new EmbeddedPostgres({
  databaseDir: dbDir,
  user: 'postgres',
  password: 'password',
  port: 5432,
  persistent: true,
});

async function main() {
  console.log('Starting Embedded PostgreSQL...');
  await pg.start();
  console.log('PostgreSQL started on port 5432.');
  try {
    await pg.createDatabase('wellspring');
    console.log('Database wellspring created.');
  } catch (e) {
    console.log('Database wellspring already exists or ready.');
  }

  // Keep alive
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch((err) => {
  console.error('Failed to start database:', err);
  process.exit(1);
});
