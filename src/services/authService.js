const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const { USER_ROLES } = require('../utils/constants');

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function getCookieOptions() {
  return {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
    path: '/',
  };
}

async function login(email, password) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user);
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };

  return { token, user: safeUser };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
}

async function createUser({ name, email, password, role }) {
  if (!Object.values(USER_ROLES).includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const exists = await userRepository.existsByEmail(email);
  if (exists) {
    throw new AppError('A user with this email already exists', 409);
  }

  const hashed = await bcrypt.hash(password, config.bcryptRounds);
  return userRepository.create({
    name,
    email,
    password: hashed,
    role,
  });
}

async function listUsers(filters) {
  return userRepository.findAll(filters);
}

module.exports = {
  login,
  getCurrentUser,
  createUser,
  listUsers,
  signToken,
  getCookieOptions,
};
