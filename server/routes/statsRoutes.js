const express = require('express');
const router = express.Router();
const { getDynamicStats } = require('../controllers/statsController.js');
const { protect } = require('../middleware/authMiddleware.js');
const { admin } = require('../middleware/adminMiddleware.js');

// Usamos POST para poder enviar un cuerpo con el rango de fechas
router.post('/query', protect, admin, getDynamicStats);

module.exports = router;
