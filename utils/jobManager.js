const { PrismaClient } = require('../generated/prisma');
const cron = require('node-cron');
const prisma = new PrismaClient();

// Mapa en memoria para guardar los cron jobs activos.
// La clave es una combinacion de userId y periodo (por ejemplo: "1-morning")
const jobs = new Map(); // Map<userId-period, cronJob>

// Funcion para construir una clave unica por usuario y periodo
function getKey(userId, period) {
  return `${userId}-${period}`;
}

// Funcion auxiliar para obtener el dia actual en minusculas (por ejemplo: "monday")
function getToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function createOrUpdateJob(userId, period, hour) {
  const key = getKey(userId, period);

  if (jobs.has(key)) {
    jobs.get(key).stop();
    jobs.delete(key);
  }

  const expression = `0 ${hour} * * *`;

  const job = cron.schedule(expression, async () => {
    try {
      const today = getToday();

      // Buscar los habitos activos del usuario que correspondan al dia actual
      const habits = await prisma.userHabit.findMany({
        where: {
          userId,
          isActive: true,
          reminder: true,
        },
      });

      for (const habit of habits) {
        const freq = habit.frequency;

        // Validar si es tipo semanal y contiene el dia actual
        if (freq.type === 'weekly' && freq.days.includes(today)) {
          await prisma.notification.create({
            data: {
              userId,
              title: `Recordatorio de habito: ${habit.name}`,
              message: `Es hora de realizar tu habito: ${habit.name}`,
              type: 'reminder',
            },
          });

          console.log(`Notificacion creada para user ${userId} - habito ${habit.name}`);
        }
      }
    } catch (error) {
      console.error(`Error al crear notificaciones para user ${userId} - ${period}:`, error);
    }
  });

  jobs.set(key, job);
}

// Carga los cron jobs de todos los usuarios al iniciar la aplicacion
// Esto permite restaurar todos los jobs en memoria despues de reiniciar el servidor
async function loadAllJobs() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    createOrUpdateJob(user.id, 'morning', user.morningHour);
    createOrUpdateJob(user.id, 'afternoon', user.afternoonHour);
    createOrUpdateJob(user.id, 'night', user.nightHour);
  }

  console.log(`Se cargaron ${users.length * 3} cron jobs desde la base de datos.`);
}

module.exports = {
  loadAllJobs,
  createOrUpdateJob
};
