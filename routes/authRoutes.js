const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
  verificarAuth,
  verificarRol,
  register,
  login,
  logout,
  recoverPassword,
  validateResetToken,
  resetPassword,
  deleteAccount,
  updateProfile
} = require('../controllers/authController');

const { validateRegister, validateLogin, validateDeleteAcc } = require('../middlewares/validateAuth');

// Autenticación y protección por rol
router.use(verificarAuth);
router.use(verificarRol('UAI'));

// Rutas de administración
router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.crearUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Autenticación y recuperación
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/deleteAcc', validateDeleteAcc, deleteAccount);
router.get('/logout', logout);
router.post('/recover-password', recoverPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

// Perfil
router.put('/user/profile', updateProfile); // Puedes protegerla si es necesario

module.exports = router;
