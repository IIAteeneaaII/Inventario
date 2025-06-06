const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
  register,
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
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/recover-password', recoverPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

// ✅ Rutas protegidas (deben ir después del middleware)
router.use(verificarAuth); // Desde aquí ya debe ir autenticado

// Rutas protegidas (para redirigir a los roles)
// Dashboard para rol Admin inventario
router.get('/adminventario', 
  verificarAuth,   
  verificarRol(['U.UAI']), 
  (req, res) => {
      res.render('dashboard_admin_inv', { user: req.user });
  }
);
// Dashboard para rol almacen
router.get('/almacen', 
  verificarAuth,   
  verificarRol(['U.UA']), 
  (req, res) => {
      res.render('dashboard_almacen', { user: req.user });
  }
);
// Dashboard para rol visualizador
router.get('/visualizacion', 
  verificarAuth,   
  verificarRol(['U.UV']), 
  (req, res) => {
      res.render('dashboard_visualizador', { user: req.user });
  }
);
// Dashboard para rol registro
router.get('/registro', 
  verificarAuth,   
  verificarRol(['U.Reg']), 
  (req, res) => {
      res.render('dashboard_registro', { user: req.user });
  }
);
// Dashboard para rol Test inicial
router.get('/testini', 
  verificarAuth,   
  verificarRol(['U.TI']), 
  (req, res) => {
      res.render('dashboard_test_ini', { user: req.user });
  }
);
// Dashboard para rol retest
router.get('/reparacion', 
  verificarAuth,   
  verificarRol(['U.R']), 
  (req, res) => {
      res.render('dashboard-retest', { user: req.user });
  }
);
// Dashboard para rol Cosmetica
router.get('/calidad', 
  verificarAuth,   
  verificarRol(['U.C']), 
  (req, res) => {
      res.render('dashboard_cosmetica', { user: req.user });
  }
);
// Dashboard para rol Empaque
router.get('/empaque', 
  verificarAuth,   
  verificarRol(['U.E']), 
  (req, res) => {
      res.render('dashboard_empaque', { user: req.user });
  }
);
// Dashboard para Liberacion y limpieza
router.get('/linealote', 
  verificarAuth,   
  verificarRol(['U.LL']), 
  (req, res) => {
      res.render('dashboard-liberacion_limpieza', { user: req.user });
  }
);
router.post('/deleteAcc', validateDeleteAcc, deleteAccount);
router.get('/logout', logout);
router.put('/user/profile', updateProfile);

// ✅ Solo admin UAI puede acceder
router.use(verificarRol('UAI'));
router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.crearUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

module.exports = router;
