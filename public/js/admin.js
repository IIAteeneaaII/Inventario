const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarAuth, verificarRol } = require('../controllers/authController'); 
// o '../middlewares/auth' según dónde tengas esos middlewares

// Primero validar token y luego verificar rol UAI
router.use(verificarAuth);
router.use(verificarRol('UAI'));

router.get('/usuarios', adminController.listarUsuarios);
router.post('/usuarios', adminController.crearUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);

router.get('/logs', adminController.verLogs); // bitácora

module.exports = router;
