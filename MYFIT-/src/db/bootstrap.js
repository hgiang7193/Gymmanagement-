const { loadEnv } = require('../shared/load-env');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createPostgresPool } = require('../shared/infrastructure/postgres/pool');

loadEnv();

function getSchemaPath() {
  return path.join(__dirname, 'schema.sql');
}

async function bootstrapDatabase(options = {}) {
  const shouldClosePool = !options.pool;
  const pool = options.pool ?? createPostgresPool(options.connectionString ?? process.env.DATABASE_URL);
  try {
    const sql = await fs.readFile(getSchemaPath(), 'utf8');
    await pool.query(sql);
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  bootstrapDatabase()
    .then(() => {
      process.stdout.write('Database bootstrap completed.\n');
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { bootstrapDatabase, getSchemaPath };
