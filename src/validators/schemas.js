const Joi = require('joi');
const AppError = require('../utils/AppError');
const { LEAD_STATUSES, USER_ROLES } = require('../utils/constants');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(new AppError('Validation failed', 400, details));
    }

    req[property] = value;
    return next();
  };
}

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
});

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .required(),
});

const createLeadSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(7).max(50).required(),
  budget: Joi.number().min(0).precision(2).allow(null).optional(),
  message: Joi.string().trim().min(5).max(2000).required(),
});

const updateLeadSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  email: Joi.string().email(),
  phone: Joi.string().trim().min(7).max(50),
  budget: Joi.number().min(0).precision(2).allow(null),
  message: Joi.string().trim().min(5).max(2000),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...LEAD_STATUSES)
    .required(),
});

const assignLeadSchema = Joi.object({
  assignedTo: Joi.string().uuid().allow(null).required(),
});

const addNoteSchema = Joi.object({
  note: Joi.string().trim().min(1).max(5000).required(),
});

module.exports = {
  validate,
  loginSchema,
  createUserSchema,
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  assignLeadSchema,
  addNoteSchema,
};
