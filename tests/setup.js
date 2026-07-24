const { pool } = require('../src/database/pool');

afterAll(async () => {
  await pool.end();
});
