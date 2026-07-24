const createApp = require('./app');
const config = require('./config');
const { pool } = require('./database/pool');

const app = createApp();

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} [${config.env}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
