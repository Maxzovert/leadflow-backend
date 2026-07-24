const AppError = require('../utils/AppError');
const { fail } = require('../utils/response');
const config = require('../config');

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.details || null;

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid identifier format';
  }

  if (config.env !== 'production' && statusCode === 500) {
    console.error(err);
  } else if (statusCode >= 500) {
    console.error(err.message);
  }

  if (statusCode === 500 && config.env === 'production') {
    message = 'Internal server error';
    errors = null;
  }

  return fail(res, { statusCode, message, errors });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
