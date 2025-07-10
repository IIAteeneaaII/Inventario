const express = require('express');
const router = express.Router();
const { verificarAuth, verificarRol } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');


// Rutas protegidas (para redirigir a los roles)
// Dashboard para rol Admin inventario
router.get('/adminventario', 
  verificarAuth,   
  verificarRol(['UAI']), 
  (req, res) => {
      res.render('admin_dashboard', { user: req.user });
  }
);
// Dashboard para rol registro
router.get('/registro', 
  verificarAuth,   
  verificarRol(['UReg']), 
  (req, res) => {
      res.render('registro_lote', { user: req.user });
  }
);
router.get('/seleccionlote', 
  verificarAuth,   
  verificarRol(['UA', 'UV', 'UTI', 'UR', 'UC', 'UE', 'ULL','UReg']), 
  (req, res) => {
      console.log(`Acceso autorizado: ${req.user.userName} (${req.user.rol}) -> /seleccionlote`);
      res.render('seleccion_lote', { user: req.user });
  }
);

// Dashboard para rol almacen
router.get('/almacen', 
  verificarAuth,   
  verificarRol('UA'), 
  (req, res) => {
      res.render('dashboard_almacen', { user: req.user });
  }
);
// Dashboard para rol visualizador
router.get('/visualizacion', 
  verificarAuth,   
  verificarRol('UV'), 
  (req, res) => {
      res.render('dashboard_visualizador', { user: req.user });
  }
);

// Dashboard para redireccionamiento a la vista de crear lote
router.get('/crearlote', 
   
  (req, res) => {
      res.render('asignacion_lote', { user: req.user });
  }
);
// Dashboard para rol Test inicial
router.get('/testini', 
  verificarAuth,   
  verificarRol('UTI'), 
  (req, res) => {
      res.render('seleccion_lote', { user: req.user });
  }
);
// Dashboard para rol retest
router.get('/retest', 
  verificarAuth,   
  verificarRol('UR'), 
  (req, res) => {
      res.render('seleccion_lote', { user: req.user });
  }
);
// Dashboard para rol Cosmetica
router.get('/cosmetica', 
  verificarAuth,   
  verificarRol('UC'), 
  (req, res) => {
      res.render('seleccion_lote', { user: req.user });
  }
);
// Dashboard para rol Empaque
router.get('/empaque', 
  verificarAuth,   
  verificarRol('UE'), 
  (req, res) => {
      res.render('seleccion_lote', { user: req.user });
  }
);
// Dashboard para Liberacion y limpieza
router.get('/lineaLote', 
  verificarAuth,   
  verificarRol('ULL'), 
  (req, res) => {
      res.render('seleccion_lote', { user: req.user });
  }
);

// Dashboard para Registro
router.get('/Registros', 
  verificarAuth,   
  verificarRol('UReg'), 
  (req, res) => {
      res.render('dashboard_registros', { user: req.user });
  }
);
module.exports = router;