function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`MISSING_ENV_${name}`);
  }
  return value;
}

function getRuntimeConfig() {
  return {
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    accessTokenSecret: getRequiredEnv('ACCESS_TOKEN_SECRET'),
    refreshTokenSecret: getRequiredEnv('REFRESH_TOKEN_SECRET'),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  };
}

module.exports = { getRuntimeConfig };
