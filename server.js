const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Rutas y controladores
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { verificarAuth, verificarRol } = require('./controllers/authController');
const { authMiddleware } = require('./middlewares/authMiddleware');

// Rutas API adicionales (asegúrate de crearlas también)
const principalScrRoutes = require('./routes/principalScrRoutes');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

// Configuración EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
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

// Rutas de autenticación
app.use('/auth', authRoutes);

// Página de login
app.get('/login', (req, res) => {
  res.render('login', {
    error: req.session?.error,
    success: req.session?.success
  });
  req.session.error = null;
  req.session.success = null;
});

// Redirección desde raíz
app.get('/', (req, res) => res.redirect('/login'));

// Rutas protegidas
app.use('/admin', verificarAuth, verificarRol('UAI'), adminRoutes);
app.use('/api', verificarAuth, inventoryRoutes);

// Dashboard admin
app.get('/admin/dashboard', verificarAuth, verificarRol('UAI'), (req, res) => {
  res.render('admin_dashboard', { usuario: req.user });
});

// Rutas EJS protegidas
app.get('/TerminosyCondiciones', (req, res) => {
  res.render('terminosyCondiciones');
});

//app.get('/Notificaciones', authMiddleware, async (req, res) => {
  //const notifications = await getRecentNotifications(req.user.id);
  //await markAllAsRead(req.user.id);
  //res.render('notificaciones', { notifications });
//});

app.get('/EliminarCuenta', authMiddleware, (req, res) => res.render('eliminarCuenta'));
app.get('/EliminarCuenta1', authMiddleware, (req, res) => res.render('eliminarCuenta1'));
app.get('/EliminarCuenta2', authMiddleware, (req, res) => res.render('eliminarCuenta2'));
app.get('/Privacidad', authMiddleware, (req, res) => res.render('privacidad'));

// Rutas API adicionales protegidas
app.use('/api/auth', authRoutes);
app.use('/api/inicio', authMiddleware, principalScrRoutes);

// Middleware de error general
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Error en el servidor' });
});

// Inicio del servidor
const { loadAllJobs } = require('./utils/jobManager');
app.listen(PORT, HOST, async () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  await loadAllJobs();
});
