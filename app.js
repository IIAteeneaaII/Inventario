const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');  // Rutas para administrador
const inventoryRoutes = require('./routes/inventoryRoutes');
const { verificarAuth, verificarRol } = require('./controllers/authController');

const app = express();

// Configuración de EJS para vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Carpeta donde están las vistas EJS

// Middlewares para procesar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (css, js, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración opcional de sesión (no obligatoria con JWT, pero puede usarse para otras cosas)
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }  // Cookies seguras solo en producción
}));

// Rutas públicas y autenticación
// Montamos todas las rutas de autenticación bajo /auth
app.use('/auth', authRoutes);

// Ruta para mostrar la página de login (GET /login)
app.get('/login', (req, res) => {
  res.render('login', {
    error: req.session?.error,
    success: req.session?.success
  });
  // Limpiar mensajes después de mostrarlos
  req.session.error = null;
  req.session.success = null;
});

// Ruta raíz redirige a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Rutas protegidas para administrador:
// Primero verificar autenticación, luego verificar que sea rol 'UAI'
// Todas las rutas definidas en adminRoutes estarán protegidas así
app.use('/admin', verificarAuth, verificarRol('UAI'), adminRoutes);

// Rutas protegidas para inventario y otras secciones (requieren sólo autenticación)
app.use('/api', verificarAuth, inventoryRoutes);

// Ruta ejemplo para mostrar dashboard admin con vista EJS
app.get('/admin/dashboard', verificarAuth, verificarRol('UAI'), (req, res) => {
  res.render('admin_dashboard', { usuario: req.usuario });
});

// Middleware para manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Error en el servidor' });
});

// Iniciar servidor en puerto definido o 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
