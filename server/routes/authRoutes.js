const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController.js');

// Importamos los middlewares
const { protect } = require('../middleware/authMiddleware.js');
const { admin } = require('../middleware/adminMiddleware.js');

// Ahora, para registrar un usuario, se debe estar logueado (protect)
// y además ser administrador (admin).
router.post('/register', protect, admin, registerUser);

// La ruta de login sigue siendo pública
router.post('/login', loginUser);

module.exports = router;
