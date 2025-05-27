const { body, validationResult } = require('express-validator');

const allowedDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
const domainRegex = new RegExp(`@(${allowedDomains.join('|').replace(/\./g, '\\.')})$`);

const validateRegister = [
  body('email')
    .isEmail().withMessage('El correo electrónico no es válido')
    .matches(domainRegex).withMessage(`El correo debe ser de: ${allowedDomains.join(', ')}`),

  body('password')
    .isAlphanumeric().withMessage('La contraseña solo debe contener letras y números')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .isLength({ max: 12 }).withMessage('La contraseña no debe exceder los 12 caracteres'),

  body('userName')
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),

  (req, res, next) => {
    console.log('body: ', req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const mensajes = errors.array().map(err => err.msg).join('-');
      return res.redirect(`/Registro?error=${encodeURIComponent(mensajes)}`);
    }
    next();
  }
];

const validateLogin = [
  body('email')
    .notEmpty().withMessage('El correo es obligatorio'),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),

  (req, res, next) => {
    console.log('body: ', req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const mensajes = errors.array().map(err => err.msg).join(' - ');
      return res.redirect(`/?error=${encodeURIComponent(mensajes)}`);
    }
    next();
  }
];

const validateDeleteAcc = [
  body('email')
    .notEmpty().withMessage('Email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateRegister,
  validateLogin,
  validateDeleteAcc
};
