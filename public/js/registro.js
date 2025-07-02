const validator = new JustValidate('#formRegistro');

validator
  .addField('#nombre', [
    { rule: 'required', errorMessage: 'El nombre es obligatorio' }
  ])
  .addField('#userName', [
    { rule: 'required', errorMessage: 'El nombre de usuario es obligatorio' },
    { rule: 'minLength', value: 6, errorMessage: 'Debe tener al menos 6 caracteres' },
    { rule: 'maxLength', value: 20, errorMessage: 'No puede tener más de 20 caracteres' },
    { rule: 'customRegexp', value: /^[a-zA-Z0-9]+$/, errorMessage: 'Solo letras y números sin espacios' }
  ])
  .addField('#email', [
    { rule: 'required', errorMessage: 'El correo es obligatorio' },
    { rule: 'email', errorMessage: 'Ingresa un correo válido' }
  ])
  .addField('#password', [
    { rule: 'required', errorMessage: 'La contraseña es obligatoria' },
    {
      validator: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
      errorMessage: 'Debe tener al menos 8 caracteres, mayúsculas, minúsculas y números'
    }
  ])
  .addField('#confirmarContrasena', [
    { rule: 'required', errorMessage: 'Debes confirmar tu contraseña' },
    {
      validator: (value, fields) => value === fields['#password'].elem.value,
      errorMessage: 'Las contraseñas no coinciden'
    }
  ])
  .addField('#rol', [
    { rule: 'required', errorMessage: 'Selecciona un rol válido' }
  ])
  .addField('#terminosCheck', [
    { rule: 'required', errorMessage: 'Debes aceptar los términos' }
  ])
  .onSuccess(async (event) => {
    event.preventDefault();

    const data = {
      nombre: document.getElementById('nombre').value,
      userName: document.getElementById('userName').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      confirmarContrasena: document.getElementById('confirmarContrasena').value,
      rol: document.getElementById('rol').value
    };

    try {
      const res = await fetch('/api/auth/registro_prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const msg = await res.text();
      if (res.ok) {
        alert('Usuario registrado correctamente');
        window.location.href = '/';
      } else {
        alert('Error al registrar: ' + msg);
      }
    } catch (err) {
      alert('Error de red: ' + err.message);
    }
  });
