const { query } = require('../database/pool');

async function create({ leadId, userId, action }, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `INSERT INTO lead_activity (lead_id, user_id, action)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [leadId, userId ?? null, action]
  );
  return result.rows[0];
}

async function findByLeadId(leadId) {
  const result = await query(
    `SELECT a.id, a.lead_id, a.user_id, a.action, a.created_at,
            u.name AS user_name, u.email AS user_email
     FROM lead_activity a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = $1
     ORDER BY a.created_at DESC`,
    [leadId]
  );
  return result.rows;
}

module.exports = {
  create,
  findByLeadId,
};
