const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear Estado
router.post('/estados', async (req, res) => {
  try {
    const estado = await prisma.estado.create({ data: req.body });
    res.json(estado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener todos los estados
router.get('/estados', async (req, res) => {
  try {
    const estados = await prisma.estado.findMany();
    res.json(estados);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear CatalogoSKU
router.post('/skus', async (req, res) => {
  try {
    const sku = await prisma.catalogoSKU.create({ data: req.body });
    res.json(sku);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear Lote
router.post('/lotes', async (req, res) => {
  try {
    const lote = await prisma.lote.create({ data: req.body });
    res.json(lote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear Modem
router.post('/modems', async (req, res) => {
  try {
    const modem = await prisma.modem.create({ data: req.body });
    res.json(modem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear Usuario
router.post('/users', async (req, res) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear MotivoScrap
router.post('/motivos-scrap', async (req, res) => {
  try {
    const motivo = await prisma.motivoScrap.create({ data: req.body });
    res.json(motivo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear TransicionEstado
router.post('/transiciones-estado', async (req, res) => {
  try {
    const transicion = await prisma.transicionEstado.create({ data: req.body });
    res.json(transicion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear TransicionFase
router.post('/transiciones-fase', async (req, res) => {
  try {
    const transicion = await prisma.transicionFase.create({ data: req.body });
    res.json(transicion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear Log
router.post('/logs', async (req, res) => {
  try {
    const log = await prisma.log.create({ data: req.body });
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear EstadoTransicion
router.post('/estado-transiciones', async (req, res) => {
  try {
    const estadoTransicion = await prisma.estadoTransicion.create({ data: req.body });
    res.json(estadoTransicion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Crear Registro
router.post('/registros', async (req, res) => {
  try {
    console.log(req.body); // <-- Agrega esto
    const registro = await prisma.registro.create({ data: req.body });
    res.json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;