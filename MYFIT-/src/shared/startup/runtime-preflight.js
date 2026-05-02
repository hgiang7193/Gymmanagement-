const REQUIRED_ENV_NAMES = ['DATABASE_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const REQUIRED_TABLES = ['roles', 'users', 'profiles', 'branches', 'membership_plans', 'trial_bookings'];

function collectRuntimeEnvIssues(env = process.env) {
  const issues = [];

  for (const name of REQUIRED_ENV_NAMES) {
    if (!env[name]) {
      issues.push({
        kind: 'missing_env',
        message: `Missing required env var ${name}.`,
        fix: 'Copy .env.example to .env and fill in the runtime secrets before starting the app.',
      });
    }
  }

  if (env.DATABASE_URL) {
    try {
      const parsed = new URL(env.DATABASE_URL);
      if (!parsed.protocol.startsWith('postgres')) {
        issues.push({
          kind: 'invalid_database_url',
          message: 'DATABASE_URL must use a postgres/postgresql scheme.',
          fix: 'Use a URL like postgresql://postgres:postgres@localhost:5432/myfit.',
        });
      }
    } catch (error) {
      issues.push({
        kind: 'invalid_database_url',
        message: 'DATABASE_URL is not a valid URL.',
        fix: 'Use a URL like postgresql://postgres:postgres@localhost:5432/myfit.',
      });
    }
  }

  if (env.PORT) {
    const port = Number(env.PORT);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      issues.push({
        kind: 'invalid_port',
        message: `PORT must be an integer between 1 and 65535. Current value: "${env.PORT}".`,
        fix: 'Set PORT to a valid TCP port such as 3000.',
      });
    }
  }

  return issues;
}

async function checkDatabaseReadiness(pool) {
  const issues = [];

  try {
    await pool.query('select 1');
  } catch (error) {
    issues.push({
      kind: 'database_unreachable',
      message: `Cannot connect to PostgreSQL: ${error.message}`,
      fix: 'Start local PostgreSQL with `npm run db:up` or verify DATABASE_URL points to a live database.',
    });
    return issues;
  }

  const result = await pool.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name = any($1::text[])`,
    [REQUIRED_TABLES]
  );

  const existing = new Set(result.rows.map((row) => row.table_name));
  const missingTables = REQUIRED_TABLES.filter((name) => !existing.has(name));
  if (missingTables.length) {
    issues.push({
      kind: 'schema_not_bootstrapped',
      message: `Database is reachable but schema is incomplete. Missing tables: ${missingTables.join(', ')}.`,
      fix: 'Run `npm run db:bootstrap` and then `npm run db:seed` before starting the app.',
    });
  }

  return issues;
}

function formatPreflightIssues(issues) {
  const lines = ['MYFIT startup preflight failed:', ''];
  issues.forEach((issue, index) => {
    lines.push(`${index + 1}. ${issue.message}`);
    if (issue.fix) {
      lines.push(`   Fix: ${issue.fix}`);
    }
  });
  return lines.join('\n');
}

async function runStartupPreflight({ env = process.env, pool }) {
  const envIssues = collectRuntimeEnvIssues(env);
  if (envIssues.length) {
    throw new Error(formatPreflightIssues(envIssues));
  }

  const dbIssues = await checkDatabaseReadiness(pool);
  if (dbIssues.length) {
    throw new Error(formatPreflightIssues(dbIssues));
  }
}

module.exports = {
  REQUIRED_ENV_NAMES,
  REQUIRED_TABLES,
  collectRuntimeEnvIssues,
  checkDatabaseReadiness,
  formatPreflightIssues,
  runStartupPreflight,
};
