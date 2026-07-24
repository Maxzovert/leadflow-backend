const bcrypt = require('bcrypt');
const { query } = require('./pool');
const { migrate } = require('./migrate');
const config = require('../config');

async function seed() {
  await migrate();

  const passwordHash = await bcrypt.hash('Admin@123', config.bcryptRounds);
  const memberHash = await bcrypt.hash('Member@123', config.bcryptRounds);

  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'ADMIN')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = EXCLUDED.role`,
    ['Demo Admin', 'admin@demo.com', passwordHash]
  );

  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'MEMBER')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = EXCLUDED.role`,
    ['Demo Member', 'member@demo.com', memberHash]
  );

  console.log('Seed completed.');
  console.log('Demo Admin:  admin@demo.com / Admin@123');
  console.log('Demo Member: member@demo.com / Member@123');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
