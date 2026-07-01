const { Pool } = require('pg');
const dns = require('dns');

let pool;

function getPool() {
  if (!pool) {
    const url = new URL(process.env.DATABASE_URL);
    const addresses = dns.resolve4Sync(url.hostname);
    url.hostname = addresses[0];

    pool = new Pool({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

module.exports = { getPool };
