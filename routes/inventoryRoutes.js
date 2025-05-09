const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
  res.send('Inventory route working!');
});

module.exports = router;
