const { query } = require('../database/pool');

async function create({ leadId, userId, note }, client = null) {
  const executor = client || { query };
  const result = await executor.query(
    `INSERT INTO lead_notes (lead_id, user_id, note)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [leadId, userId, note]
  );
  return result.rows[0];
}

async function findByLeadId(leadId) {
  const result = await query(
    `SELECT n.id, n.lead_id, n.user_id, n.note, n.created_at,
            u.name AS user_name, u.email AS user_email, u.role AS user_role
     FROM lead_notes n
     JOIN users u ON u.id = n.user_id
     WHERE n.lead_id = $1
     ORDER BY n.created_at DESC`,
    [leadId]
  );
  return result.rows;
}

module.exports = {
  create,
  findByLeadId,
};
