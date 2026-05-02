const { Pool } = require('pg');

/**
 * Returns true when the connection string explicitly requests SSL
 * (sslmode=require/verify-ca/verify-full) or when the host is NOT
 * localhost / 127.0.0.1 (i.e. a remote / Supabase host).
 *
 * Local development (postgres running in Docker on localhost) keeps TLS off
 * so you never need to configure certificates in dev.
 */
function shouldUseSsl(connectionString) {
  if (!connectionString) return false;

  // Explicit sslmode in the query string
  if (/[?&]sslmode=(require|verify-ca|verify-full)/i.test(connectionString)) {
    return true;
  }

  // Remote host → assume SSL is needed (Supabase, RDS, etc.)
  try {
    const { hostname } = new URL(connectionString);
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    return !isLocal;
  } catch {
    return false;
  }
}

function createPostgresPool(connectionString) {
  const ssl = shouldUseSsl(connectionString)
    ? { rejectUnauthorized: false } // Supabase uses a valid cert; set true + ca bundle for strict verify
    : false;

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    ssl,
  });
}

module.exports = { createPostgresPool };
