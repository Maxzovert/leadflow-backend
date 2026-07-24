const { query } = require('../database/pool');

const LEAD_SELECT = `
  l.id,
  l.name,
  l.email,
  l.phone,
  l.budget,
  l.message,
  l.status,
  l.assigned_to,
  l.created_at,
  l.updated_at,
  u.name AS assigned_to_name,
  u.email AS assigned_to_email
`;

function buildListQuery({ status, assignedTo, search, sort = 'newest', page = 1, limit = 10, scopedUserId }) {
  const where = [];
  const params = [];
  let idx = 1;

  if (scopedUserId) {
    where.push(`l.assigned_to = $${idx++}`);
    params.push(scopedUserId);
  }

  if (status) {
    where.push(`l.status = $${idx++}`);
    params.push(status);
  }

  if (assignedTo) {
    where.push(`l.assigned_to = $${idx++}`);
    params.push(assignedTo);
  }

  if (search) {
    where.push(
      `(l.name ILIKE $${idx} OR l.email ILIKE $${idx} OR l.phone ILIKE $${idx} OR COALESCE(l.message, '') ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx += 1;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = sort === 'oldest' ? 'ORDER BY l.created_at ASC' : 'ORDER BY l.created_at DESC';
  const offset = (page - 1) * limit;

  const countSql = `SELECT COUNT(*)::int AS total FROM leads l ${whereSql}`;
  const dataSql = `
    SELECT ${LEAD_SELECT}
    FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_to
    ${whereSql}
    ${orderSql}
    LIMIT $${idx++} OFFSET $${idx}
  `;

  const dataParams = [...params, limit, offset];

  return { countSql, dataSql, countParams: params, dataParams };
}

async function findAll(filters) {
  const { countSql, dataSql, countParams, dataParams } = buildListQuery(filters);
  const [countResult, dataResult] = await Promise.all([
    query(countSql, countParams),
    query(dataSql, dataParams),
  ]);

  return {
    rows: dataResult.rows,
    total: countResult.rows[0].total,
  };
}

async function findById(id) {
  const result = await query(
    `SELECT ${LEAD_SELECT}
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     WHERE l.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function create({ name, email, phone, budget, message }, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `INSERT INTO leads (name, email, phone, budget, message, status)
     VALUES ($1, $2, $3, $4, $5, 'NEW')
     RETURNING *`,
    [name, email.toLowerCase(), phone, budget ?? null, message]
  );
  return result.rows[0];
}

async function update(id, fields, client = null) {
  const executor = client || { query };
  const allowed = ['name', 'email', 'phone', 'budget', 'message', 'status', 'assigned_to'];
  const sets = [];
  const params = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      sets.push(`${key} = $${idx++}`);
      params.push(fields[key]);
    }
  }

  if (!sets.length) {
    return findById(id);
  }

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const result = await executor.query(
    `UPDATE leads SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

async function updateStatus(id, status, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

async function assign(id, assignedTo, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [assignedTo, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  updateStatus,
  assign,
};
