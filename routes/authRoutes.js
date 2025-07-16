const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const adminController = require('../controllers/adminController');
const {
  registrar,
  login, // es correcto que esta ruta este para permisos de admin?
  logout, 
  recoverPassword,
  validateResetToken,
  resetPassword,
  deleteAccount,
  updateProfile,
  verificarAuth,
  verificarRol
} = require('../controllers/authController');

const { validateRegister, validateLogin, validateDeleteAcc } = require('../middlewares/validateAuth');

// ✅ Rutas públicas (NO deben requerir autenticación)
router.post('/login', validateLogin, login);
router.post('/recover-password', recoverPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);
router.post('/registro_prueba', validateRegister, registrar);


// ✅ Rutas protegidas (deben ir después del middleware)
router.use(verificarAuth); // Desde aquí ya debe ir autenticado

router.post('/deleteAcc', validateDeleteAcc, deleteAccount);
router.get('/logout', logout);
router.put('/user/profile', updateProfile);

// ✅ Solo admin UAI puede acceder
router.use(verificarRol('UAI'));
router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.crearUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Middleware para manejar errores de validación
router.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mensajes = errors.array().map(err => err.msg).join(' - ');
    // Si es fetch/ajax, responde JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({ error: mensajes });
    }
    // Si es formulario normal, redirige
    return res.redirect(`/registro?error=${encodeURIComponent(mensajes)}`);
  }
  next();
});

module.exports = router;
