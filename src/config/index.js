require('dotenv').config();

const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  for (const key of REQUIRED_IN_PRODUCTION) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable in production: ${key}`);
    }
  }
}

const config = {
  env: nodeEnv,
  port: Number(process.env.PORT) || 5000,
  databaseUrl: requireEnv(
    'DATABASE_URL',
    nodeEnv === 'test'
      ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      : undefined
  ),
  jwt: {
    secret: requireEnv(
      'JWT_SECRET',
      nodeEnv === 'test' ? 'test-jwt-secret-do-not-use-in-prod' : undefined
    ),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookie: {
    name: process.env.COOKIE_NAME || 'lead_mgmt_token',
    secure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || (nodeEnv === 'production' ? 'none' : 'lax'),
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
};

module.exports = config;
