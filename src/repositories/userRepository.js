const { query } = require('../database/pool');

const USER_SAFE_COLUMNS = 'id, name, email, role, created_at';

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `SELECT ${USER_SAFE_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findByIdWithPassword(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findAll({ role } = {}) {
  if (role) {
    const result = await query(
      `SELECT ${USER_SAFE_COLUMNS} FROM users WHERE role = $1 ORDER BY created_at DESC`,
      [role]
    );
    return result.rows;
  }

  const result = await query(
    `SELECT ${USER_SAFE_COLUMNS} FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

async function create({ name, email, password, role }) {
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_SAFE_COLUMNS}`,
    [name, email.toLowerCase(), password, role]
  );
  return result.rows[0];
}

async function existsByEmail(email) {
  const result = await query('SELECT 1 FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rowCount > 0;
}

module.exports = {
  findByEmail,
  findById,
  findByIdWithPassword,
  findAll,
  create,
  existsByEmail,
};
