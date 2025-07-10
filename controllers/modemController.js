import { validarTransicionFase } from '../services/modemService.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
const prisma = new PrismaClient();

export async function actualizarFaseModem(req, res) {
  const { modemId, nuevaFase, estadoNuevo } = req.body;
  const userId = req.session?.userId || 'anon';
  const sessionId = req.sessionID;

  try {
    const modem = await prisma.modem.findUnique({
      where: { id: modemId }
    });

    if (!modem) {
      logger.warn({
        operation: 'actualizarFaseModem',
        user_id: userId,
        session_id: sessionId,
        modem_id: modemId,
        message: 'Modem no encontrado',
        status: 404
      });
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

    logger.info({
      operation: 'transicion_fase_modem',
      user_id: userId,
      session_id: sessionId,
      modem_id: modemId,
      from_state: modem.faseActual,
      to_state: nuevaFase,
      estado_anterior: modem.estado,
      estado_nuevo: estadoNuevo || modem.estado,
      timestamp: new Date().toISOString(),
      metadata: {
        motivo: 'Transición solicitada por usuario',
        body: req.body
      }
    });

    res.json({ message: 'Fase actualizada correctamente', modem: updatedModem });
  } catch (error) {
    logger.error({
      operation: 'actualizarFaseModem',
      user_id: userId,
      session_id: sessionId,
      modem_id: modemId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({ message: error.message });
  }
}
