const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarAuth, verificarRol } = require('../controllers/authController');

router.get('/', (req, res) => {
  // Aquí puedes renderizar la vista del dashboard admin o redirigir
  res.redirect('/admin/dashboard');
});

// Middleware para proteger todas las rutas: primero verifica que el usuario esté autenticado
router.use(verificarAuth);

// Middleware para verificar que el usuario tenga el rol 'UAI' (Administrador de Inventario)
router.use(verificarRol('UAI'));



//Ruta para registrar un nuevo usuario
router.post('/usuarios/nuevo', adminController.register)
// Ruta para listar todos los usuarios registrados
router.get('/usuarios', adminController.listarUsuarios);

// Ruta para crear un nuevo usuario
router.post('/usuarios', adminController.register);

// Ruta para eliminar un usuario por su ID
router.delete('/usuarios/:id', adminController.eliminarUsuario);

// Ruta para obtener los logs o bitácora de acciones
router.get('/logs', adminController.verLogs);

// Ruta para actualizar un usuario existente por su ID
router.put('/usuarios/:id', adminController.actualizarUsuario);

module.exports = router;
