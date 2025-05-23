const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const emailAdmin = 'ramelectronics@proton.me';
  const passwordPlain = 'ñhDTmbP6YkT_ñ';

  // Crear hash seguro para la contraseña
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Verificar si ya existe usuario con ese email para evitar duplicados
  const existing = await prisma.usuario.findUnique({ where: { email: emailAdmin } });

  if (!existing) {
    await prisma.usuario.create({
      data: {
        nombre: 'Administrador Principal',
        email: emailAdmin,
        password: passwordHash,
        rol: 'UAI',
      },
    });
    console.log('Usuario administrador creado');
  } else {
    console.log('Usuario administrador ya existe');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
