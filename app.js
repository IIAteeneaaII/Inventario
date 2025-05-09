const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { verificarAuth } = require('./controllers/authController');

const app = express();

// Configuración de EJS (asegúrate que 'views' apunta a la carpeta correcta)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Asegúrate que existe esta carpeta

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesión (agregado importante)
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Rutas
app.use('/auth', authRoutes);
app.use('/api', verificarAuth, inventoryRoutes);

// Rutas de vistas
app.get('/login', (req, res) => {
  res.render('login', { 
    error: req.session.error,
    success: req.session.success
  });
  req.session.error = null;
  req.session.success = null;
});

app.get('/dashboard', verificarAuth, (req, res) => {
  res.render('dashboard', { usuario: req.usuario });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Error en el servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});