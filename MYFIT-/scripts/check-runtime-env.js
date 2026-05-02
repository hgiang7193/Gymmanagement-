const { createPostgresPool } = require('../src/shared/infrastructure/postgres/pool');
const { loadEnv } = require('../src/shared/load-env');
const {
  collectRuntimeEnvIssues,
  checkDatabaseReadiness,
  formatPreflightIssues,
} = require('../src/shared/startup/runtime-preflight');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function color(name, value) {
  return `${COLORS[name]}${value}${COLORS.reset}`;
}

function parseArgs() {
  return {
    withDb: process.argv.includes('--with-db'),
  };
}

async function main() {
  loadEnv();
  const { withDb } = parseArgs();
  const envIssues = collectRuntimeEnvIssues(process.env);

  process.stdout.write(`${color('cyan', 'MYFIT Runtime Check')}\n`);
  process.stdout.write(`Mode: ${withDb ? 'env + db' : 'env only'}\n`);

  if (envIssues.length) {
    process.stderr.write(`${color('red', '❌ Runtime env check failed')}\n`);
    process.stderr.write(`${formatPreflightIssues(envIssues)}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${color('green', '✅')} Runtime env looks good\n`);

  if (!withDb) {
    process.stdout.write(`${color('yellow', '⚠️')} Database checks skipped. Run with --with-db after PostgreSQL is up.\n`);
    return;
  }

  const pool = createPostgresPool(process.env.DATABASE_URL);
  try {
    const dbIssues = await checkDatabaseReadiness(pool);
    if (dbIssues.length) {
      process.stderr.write(`${color('red', '❌ Database readiness check failed')}\n`);
      process.stderr.write(`${formatPreflightIssues(dbIssues)}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${color('green', '✅')} Database connection and schema look ready\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${color('red', '❌ Runtime check crashed')}\n`);
  process.stderr.write(`${String(error?.stack ?? error?.message ?? error)}\n`);
  process.exitCode = 1;
});
