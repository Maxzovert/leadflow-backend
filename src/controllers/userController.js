const authService = require('../services/authService');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const role = req.query.role;
  const users = await authService.listUsers(role ? { role } : {});
  return success(res, { data: { users } });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);
  return success(res, {
    statusCode: 201,
    message: 'User created successfully',
    data: { user },
  });
});

module.exports = {
  listUsers,
  createUser,
};
