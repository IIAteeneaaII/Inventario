const express = require('express');
const router = express.Router();

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

module.exports = router;
