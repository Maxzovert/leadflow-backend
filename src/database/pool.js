const { Pool } = require('pg');
const config = require('../config');

// Enable TLS only for cloud DBs (Neon) or explicit sslmode=require.
// Local Docker Postgres has no TLS — forcing SSL there breaks startup.
const needsSsl =
  Boolean(config.databaseUrl) &&
  (config.databaseUrl.includes('neon.tech') ||
    /sslmode=require/i.test(config.databaseUrl));

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};
