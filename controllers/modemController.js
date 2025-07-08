import { validarTransicionFase } from '../services/modemService.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function actualizarFaseModem(req, res) {
  const { modemId, nuevaFase, estadoNuevo } = req.body;

  try {
    const modem = await prisma.modem.findUnique({
      where: { id: modemId }
    });

    if (!modem) {
      return res.status(404).json({ message: 'Modem no encontrado' });
    }

    // Validar transición antes de actualizar
    await validarTransicionFase(modem.faseActual, nuevaFase, estadoNuevo);

    // Actualizar fase
    const updatedModem = await prisma.modem.update({
      where: { id: modemId },
      data: {
        faseActual: nuevaFase,
        estado: estadoNuevo || modem.estado,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Fase actualizada correctamente', modem: updatedModem });
  } catch (error) {
    console.error('Error al actualizar fase del modem:', error);
    res.status(400).json({ message: error.message });
  }
}
