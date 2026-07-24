const authService = require('../services/authService');
const config = require('../config');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);

  res.cookie(config.cookie.name, token, authService.getCookieOptions());

  return success(res, {
    message: 'Logged in successfully',
    data: { user },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(config.cookie.name, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  });

  return success(res, { message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return success(res, { data: { user } });
});

module.exports = {
  login,
  logout,
  me,
};
