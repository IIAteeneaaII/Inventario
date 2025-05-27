const validator = new JustValidate('#formRegistro');

validator
  .addField('#userName', [
    {
      rule: 'required',
      errorMessage: 'El nombre de usuario es obligatorio',
    },
    {
      rule: 'minLength',
      value: 6,
      errorMessage: 'Debe tener al menos 6 caracteres',
    },
    {
      rule: 'maxLength',
      value: 20,
      errorMessage: 'No puede tener más de 20 caracteres',
    },
    {
      rule: 'customRegexp', // Comprueba que solo contenga letras y números, sin símbolos
      value: /^[a-zA-Z0-9]+$/,
      errorMessage: 'Solo se permiten letras y números (sin símbolos)',
    },
  ])
  .addField('#email', [
    {
      rule: 'required',
      errorMessage: 'El correo es obligatorio',
    },
    {
      rule: 'email',
      errorMessage: 'Ingresa un correo válido',
    },
  ])
  .addField('#password', [
    {
      rule: 'required',
      errorMessage: 'La contraseña es obligatoria',
    },
    {
      rule: 'password',
      errorMessage: 'Debe contener al menos una mayúscula, una minúscula, un número',
    },
    {
      rule: 'minLength',
      value: 8,
      errorMessage: 'Debe tener al menos 8 caracteres',
    },
  ])
  .addField('#confirmarContrasena', [
    {
      rule: 'required',
      errorMessage: 'Debes confirmar tu contraseña',
    },
    {
      validator: (value, fields) => {
        return value === fields['#password'].elem.value;
      },
      errorMessage: 'Las contraseñas no coinciden',
    },
  ])
  .addField('#terminosCheck', [
    {
      rule: 'required',
      errorMessage: 'Debes aceptar los términos y condiciones',
    },
  ])
  .onSuccess((event) => {
    event.target.submit(); // <- aquí habilitas el envío real
  });

  const shark = document.querySelector(".shark-random");
const card = document.querySelector(".login-card");

if (!shark || !card) {
  console.error("No se encontró el tiburón o la tarjeta de login.");
} else {
  const maxX = card.clientWidth - shark.clientWidth;
  const maxY = card.clientHeight - shark.clientHeight;

  let sharkX = Math.random() * maxX;
  let sharkY = Math.random() * maxY;
  let moveX = 1;
  let moveY = 1;
  let movingRight = true;
  let movingDown = true;

  function moveShark() {
    if (movingRight) {
      sharkX += moveX;
      if (sharkX >= maxX) {
        movingRight = false;
        shark.style.transform = "scaleX(-1)";
      }
    } else {
      sharkX -= moveX;
      if (sharkX <= 0) {
        movingRight = true;
        shark.style.transform = "scaleX(1)";
      }
    }

    if (movingDown) {
      sharkY += moveY;
      if (sharkY >= maxY) {
        movingDown = false;
      }
    } else {
      sharkY -= moveY;
      if (sharkY <= 0) {
        movingDown = true;
      }
    }

    shark.style.left = `${sharkX}px`;
    shark.style.top = `${sharkY}px`;
  }

  setInterval(moveShark, 10);
}
