function success(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  const payload = {
    success: true,
    message,
  };

  if (data !== null) {
    payload.data = data;
  }

  if (meta !== null) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

function fail(res, { statusCode = 400, message = 'Request failed', errors = null } = {}) {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

module.exports = { success, fail };
