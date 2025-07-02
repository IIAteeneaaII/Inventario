const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Rutas y controladores
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const principalScrRoutes = require('./routes/principalScrRoutes');
const { verificarAuth, verificarRol } = require('./controllers/authController');
const { authMiddleware } = require('./middlewares/authMiddleware');
const { loadAllJobs } = require('./utils/jobManager');
const viewRoutes = require('./routes/viewRoutes');


// Configuración EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares globales
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// ========== ✅ RUTAS PÚBLICAS ========== //
app.use('/api/auth', authRoutes); // Registro, login, recuperación, etc.

// Página principal (login)
app.get('/', (req, res) => {
  res.render('login', {
    error: req.session?.error,
    success: req.session?.success
  });
  req.session.error = null;
  req.session.success = null;
});





// Página de términos
app.get('/TerminosyCondiciones', (req, res) => res.render('terminosyCondiciones'));

// ========== 🔐 RUTAS PROTEGIDAS (Requieren login) ========== //
app.use('/admin', verificarAuth, verificarRol('UAI'), adminRoutes);
app.use('/api', verificarAuth, inventoryRoutes);
app.use('/api/inicio', authMiddleware, principalScrRoutes);
app.use('/', viewRoutes);

// Página dashboard
app.get('/dashboard', verificarAuth, (req, res) => {
  if (req.user.rol === 'UAI') {
    return res.redirect('/admin/dashboard');
  }
  res.render('dashboard', { usuario: req.user });
});

// Página de registro para pruebas 
app.get('/registro_prueba', (req, res) => {
  res.render('dasboard_registro', {
    error: req.session?.error,
    success: req.session?.success
  });
});

// ========== ✅ VISTAS SECUNDARIAS PROTEGIDAS ========== //
app.get('/EliminarCuenta', authMiddleware, (req, res) => res.render('eliminarCuenta'));
app.get('/EliminarCuenta1', authMiddleware, (req, res) => res.render('eliminarCuenta1'));
app.get('/EliminarCuenta2', authMiddleware, (req, res) => res.render('eliminarCuenta2'));
app.get('/Privacidad', authMiddleware, (req, res) => res.render('privacidad'));

// ========== ✅ VISTAS DE LOTES ========== //
app.get('/asignacion-lote', verificarAuth, (req, res) => res.render('asignacion_lote'));
app.get('/registro-lote', verificarAuth, (req, res) => res.render('registro_lote'));
app.get('/consulta-ns-admin', verificarAuth, (req, res) => res.render('consulta_ns_admin'));
app.get('/seleccion-lote-admin', verificarAuth, (req, res) => res.render('seleccion_lote_admin'));
app.get('/seleccion-lote', verificarAuth, (req, res) => res.render('seleccion_lote'));



// ========== ❌ RUTA DE ERROR GLOBAL ========== //
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error_erro', { message: 'Error en el servidor' });
});

// ========== 🚀 INICIO DEL SERVIDOR ========== //
app.listen(PORT, HOST, async () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  try {
    await loadAllJobs();
    console.log('Tareas programadas cargadas');
  } catch (err) {
    console.error('Error al cargar tareas programadas:', err);
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor corriendo en puerto 3000');
});
