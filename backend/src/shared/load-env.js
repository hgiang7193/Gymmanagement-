const path = require('node:path');
const dotenv = require('dotenv');

let loaded = false;

function loadEnv() {
  if (loaded) return;
  const cwd = process.cwd();
  dotenv.config({ path: path.resolve(cwd, '.env'), quiet: true });
  dotenv.config({ path: path.resolve(cwd, '.env.local'), override: true, quiet: true });
  loaded = true;
}

module.exports = { loadEnv };
