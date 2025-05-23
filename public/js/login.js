const errorMessageDiv = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // evitar que el formulario recargue la página
  errorMessageDiv.style.display = 'none';
  errorMessageDiv.textContent = '';

  // Leer valores
  const email = document.getElementById('usuario').value.trim();
  const password = document.getElementById('contrasena').value;

  // Validación sencilla en frontend
  if (!email) {
    errorMessageDiv.textContent = 'El correo es obligatorio';
    errorMessageDiv.style.display = 'block';
    return;
  }
  // Validar formato básico de email
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    errorMessageDiv.textContent = 'Ingresa un correo válido';
    errorMessageDiv.style.display = 'block';
    return;
  }
  if (!password) {
    errorMessageDiv.textContent = 'La contraseña es obligatoria';
    errorMessageDiv.style.display = 'block';
    return;
  }
  if (password.length < 8) {
    errorMessageDiv.textContent = 'La contraseña debe tener al menos 8 caracteres';
    errorMessageDiv.style.display = 'block';
    return;
  }

  try {
    // Petición al backend
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar token JWT
      localStorage.setItem('token', data.token);

      // Mostrar botón logout
      logoutBtn.style.display = 'inline-block';

      // Redireccionar según rol
      switch(data.usuario.rol) {
        case 'UAI':
          window.location.href = '/admin/dashboard';
          break;
        case 'UReg':
          window.location.href = '/registro_lote';
          break;
        case 'UTI':
          window.location.href = '/numero_serie_testinicial';
          break;
        case 'UC':
          window.location.href = '/numero_serie_cosmetica';
          break;
        case 'ULL':
          window.location.href = '/numero_serie_liblim';
          break;
        case 'UR':
          window.location.href = '/numero_serie_retest';
          break;
        case 'UE':
          window.location.href = '/numero_serie_empaque';
          break;
        default:
          alert('Rol no reconocido');
      }
    } else {
      // Mostrar error recibido
      errorMessageDiv.textContent = data.error || 'Error en el login';
      errorMessageDiv.style.display = 'block';
    }
  } catch (error) {
    errorMessageDiv.textContent = 'Error al conectar con el servidor';
    errorMessageDiv.style.display = 'block';
  }
});

// Manejo del botón logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  logoutBtn.style.display = 'none';
  alert('Has cerrado sesión');
  window.location.href = '/login';
});
