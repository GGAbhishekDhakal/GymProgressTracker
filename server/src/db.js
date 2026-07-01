const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const url = new URL(process.env.DATABASE_URL);
    pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false },
      family: 4,
    });
  }
  return pool;
}

module.exports = { getPool };
