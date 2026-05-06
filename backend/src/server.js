const { loadEnv } = require('./shared/load-env');
const { createApp } = require('./app');
const {
  collectRuntimeEnvIssues,
  formatPreflightIssues,
  checkDatabaseReadiness,
} = require('./shared/startup/runtime-preflight');

loadEnv();

async function main() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const envIssues = collectRuntimeEnvIssues(process.env);
  if (envIssues.length) {
    throw new Error(formatPreflightIssues(envIssues));
  }

  const app = createApp();

  try {
    const dbIssues = await checkDatabaseReadiness(app.deps.pool);
    if (dbIssues.length) {
      throw new Error(formatPreflightIssues(dbIssues));
    }
  } catch (error) {
    if (app.deps?.pool?.end) {
      await app.deps.pool.end().catch(() => {});
    }
    throw error;
  }

  await app.start({ port, host });
  process.stdout.write(`MYFIT backend listening on ${app.baseUrl}\n`);

  const shutdown = async () => {
    await app.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  main().catch((error) => {
    const message = error?.message ?? String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
