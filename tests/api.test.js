const request = require('supertest');
const bcrypt = require('bcrypt');
const createApp = require('../src/app');
const { query } = require('../src/database/pool');
const { migrate } = require('../src/database/migrate');
const config = require('../src/config');

const app = createApp();

async function resetDatabase() {
  await query(`
    TRUNCATE TABLE lead_activity, lead_notes, leads, users RESTART IDENTITY CASCADE
  `);
}

async function createUser({
  name = 'Test User',
  email,
  password = 'Password@123',
  role = 'MEMBER',
}) {
  const hash = await bcrypt.hash(password, 4);
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email.toLowerCase(), hash, role]
  );
  return { ...result.rows[0], password };
}

async function loginAs(email, password) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  return { agent, res };
}

beforeAll(async () => {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL or TEST_DATABASE_URL is required for tests');
  }
  await migrate();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('Authentication', () => {
  test('logs in with valid credentials and sets httpOnly cookie', async () => {
    await createUser({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'ADMIN',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(new RegExp(config.cookie.name));
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  test('rejects invalid credentials', async () => {
    await createUser({ email: 'admin@test.com', password: 'Admin@123', role: 'ADMIN' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'not-the-right-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns current user via /me when authenticated', async () => {
    await createUser({
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'ADMIN',
      name: 'Admin',
    });

    const { agent, res: loginRes } = await loginAs('admin@test.com', 'Admin@123');
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('admin@test.com');
  });

  test('logout clears cookie', async () => {
    await createUser({ email: 'admin@test.com', password: 'Admin@123', role: 'ADMIN' });
    const { agent } = await loginAs('admin@test.com', 'Admin@123');

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});

describe('Protected routes', () => {
  test('blocks unauthenticated access to leads list', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  test('blocks members from user management', async () => {
    await createUser({ email: 'member@test.com', password: 'Member@123', role: 'MEMBER' });
    const { agent } = await loginAs('member@test.com', 'Member@123');

    const res = await agent.get('/api/users');
    expect(res.status).toBe(403);
  });
});

describe('Lead creation', () => {
  test('creates a public lead and logs activity', async () => {
    const res = await request(app).post('/api/leads').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890',
      budget: 5000,
      message: 'Interested in your services',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.lead.status).toBe('NEW');

    const activity = await query('SELECT * FROM lead_activity WHERE lead_id = $1', [
      res.body.data.lead.id,
    ]);
    expect(activity.rows.length).toBe(1);
    expect(activity.rows[0].action).toBe('Lead created');
  });

  test('validates lead payload', async () => {
    const res = await request(app).post('/api/leads').send({
      name: 'A',
      email: 'bad',
      phone: '1',
      message: 'hi',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Lead assignment and permissions', () => {
  test('admin can assign lead to member', async () => {
    const admin = await createUser({
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'ADMIN',
      name: 'Admin',
    });
    const member = await createUser({
      email: 'member@test.com',
      password: 'Member@123',
      role: 'MEMBER',
      name: 'Member',
    });

    const leadRes = await request(app).post('/api/leads').send({
      name: 'Lead One',
      email: 'lead@example.com',
      phone: '+1111111111',
      budget: 1000,
      message: 'Please contact me soon',
    });

    const { agent } = await loginAs('admin@test.com', 'Admin@123');
    const assignRes = await agent
      .patch(`/api/leads/${leadRes.body.data.lead.id}/assign`)
      .send({ assignedTo: member.id });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.lead.assigned_to).toBe(member.id);

    const activity = await query(
      `SELECT action FROM lead_activity WHERE lead_id = $1 ORDER BY created_at DESC`,
      [leadRes.body.data.lead.id]
    );
    expect(activity.rows[0].action).toMatch(/assigned/i);
    expect(admin.id).toBeTruthy();
  });

  test('member cannot assign leads', async () => {
    const member = await createUser({
      email: 'member@test.com',
      password: 'Member@123',
      role: 'MEMBER',
    });
    const other = await createUser({
      email: 'other@test.com',
      password: 'Member@123',
      role: 'MEMBER',
    });

    const leadRes = await request(app).post('/api/leads').send({
      name: 'Lead Two',
      email: 'lead2@example.com',
      phone: '+2222222222',
      message: 'Need a proposal please',
    });

    await query('UPDATE leads SET assigned_to = $1 WHERE id = $2', [
      member.id,
      leadRes.body.data.lead.id,
    ]);

    const { agent } = await loginAs('member@test.com', 'Member@123');
    const res = await agent
      .patch(`/api/leads/${leadRes.body.data.lead.id}/assign`)
      .send({ assignedTo: other.id });

    expect(res.status).toBe(403);
  });

  test('member only sees assigned leads', async () => {
    const member = await createUser({
      email: 'member@test.com',
      password: 'Member@123',
      role: 'MEMBER',
    });

    const mine = await request(app).post('/api/leads').send({
      name: 'Mine',
      email: 'mine@example.com',
      phone: '+3333333333',
      message: 'Assigned lead message',
    });
    const other = await request(app).post('/api/leads').send({
      name: 'Other',
      email: 'other@example.com',
      phone: '+4444444444',
      message: 'Unassigned lead message',
    });

    await query('UPDATE leads SET assigned_to = $1 WHERE id = $2', [
      member.id,
      mine.body.data.lead.id,
    ]);

    const { agent } = await loginAs('member@test.com', 'Member@123');
    const listRes = await agent.get('/api/leads');

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.leads).toHaveLength(1);
    expect(listRes.body.data.leads[0].id).toBe(mine.body.data.lead.id);
    expect(listRes.body.data.leads[0].id).not.toBe(other.body.data.lead.id);
  });
});

describe('Status update', () => {
  test('updates status and creates activity log', async () => {
    const admin = await createUser({
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'ADMIN',
    });

    const leadRes = await request(app).post('/api/leads').send({
      name: 'Status Lead',
      email: 'status@example.com',
      phone: '+5555555555',
      message: 'Ready for contact',
    });

    const { agent } = await loginAs('admin@test.com', 'Admin@123');
    const res = await agent
      .patch(`/api/leads/${leadRes.body.data.lead.id}/status`)
      .send({ status: 'CONTACTED' });

    expect(res.status).toBe(200);
    expect(res.body.data.lead.status).toBe('CONTACTED');

    const activity = await query(
      `SELECT action FROM lead_activity WHERE lead_id = $1 ORDER BY created_at DESC`,
      [leadRes.body.data.lead.id]
    );
    expect(activity.rows[0].action).toMatch(/Status changed/);
    expect(admin.id).toBeTruthy();
  });
});

describe('Notes and activity', () => {
  test('member can add note to assigned lead', async () => {
    const member = await createUser({
      email: 'member@test.com',
      password: 'Member@123',
      role: 'MEMBER',
    });

    const leadRes = await request(app).post('/api/leads').send({
      name: 'Note Lead',
      email: 'note@example.com',
      phone: '+6666666666',
      message: 'Looking for pricing details',
    });

    await query('UPDATE leads SET assigned_to = $1 WHERE id = $2', [
      member.id,
      leadRes.body.data.lead.id,
    ]);

    const { agent } = await loginAs('member@test.com', 'Member@123');
    const noteRes = await agent
      .post(`/api/leads/${leadRes.body.data.lead.id}/notes`)
      .send({ note: 'Called the customer' });

    expect(noteRes.status).toBe(201);

    const activityRes = await agent.get(`/api/leads/${leadRes.body.data.lead.id}/activity`);
    expect(activityRes.status).toBe(200);
    expect(activityRes.body.data.activity.some((a) => a.action === 'Note added')).toBe(true);
  });
});

describe('Pagination and filtering', () => {
  test('paginates and filters by status', async () => {
    await createUser({
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'ADMIN',
    });

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/leads').send({
        name: `Lead ${i}`,
        email: `lead${i}@example.com`,
        phone: `+100000000${i}`,
        message: `Message body number ${i}`,
      });
    }

    const leads = await query('SELECT id FROM leads ORDER BY created_at ASC');
    await query('UPDATE leads SET status = $1 WHERE id = $2', ['WON', leads.rows[0].id]);
    await query('UPDATE leads SET status = $1 WHERE id = $2', ['WON', leads.rows[1].id]);

    const { agent } = await loginAs('admin@test.com', 'Admin@123');
    const res = await agent.get('/api/leads?status=WON&page=1&limit=10&sort=oldest');

    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.page).toBe(1);
  });
});
