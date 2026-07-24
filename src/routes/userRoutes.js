const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, createUserSchema } = require('../validators/schemas');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

router.use(requireAuth, requireRole(USER_ROLES.ADMIN));

router.get('/', userController.listUsers);
router.post('/', validate(createUserSchema), userController.createUser);

module.exports = router;
