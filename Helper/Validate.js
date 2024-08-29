const { check, validationResult } = require('express-validator');

const User = require('../Models/Users'); 

const validateUser = [
  // Validate name
  check('userName')
    .isLength({ min: 1 })
    .withMessage('Name is required')
    .trim(),

  // Validate email
  check('email')
    .isEmail()
    .withMessage('Invalid email address')
    .trim()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('Email already in use');
      }
    }),

  // Validate password
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter'),

  // Validate retypePassword
  check('retypePassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validateUser, handleValidationErrors };
