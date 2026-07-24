const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const { success } = require('./utils/response');

function normalizeOrigin(origin) {
  if (!origin) return origin;
  return origin.trim().replace(/\/$/, '');
}

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  const allowedOrigins = config.clientUrl
    .split(',')
    .map((o) => normalizeOrigin(o))
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients (health checks, curl) send no Origin
        if (!origin) {
          return callback(null, true);
        }

        const normalized = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalized)) {
          return callback(null, true);
        }

        console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Ensure preflight responses include credentials headers
  app.options('*', cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
    },
  });

  app.use('/api', limiter);

  app.get('/health', (req, res) => {
    success(res, {
      message: 'API is healthy',
      data: {
        env: config.env,
        corsOrigins: allowedOrigins,
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/leads', leadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
