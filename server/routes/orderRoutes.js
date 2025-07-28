const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getTodayUserOrders,
  updateOrder,
  deleteOrder,
  checkOrderExists,
} = require('../controllers/orderController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Ruta para crear un pedido y obtener todos los pedidos (para admin)
router.route('/').post(protect, createOrder).get(protect, getOrders);

// Ruta para obtener los pedidos del día del usuario logueado
router.route('/today').get(protect, getTodayUserOrders);

// Ruta para actualizar y eliminar un pedido específico por su ID
router.route('/:id').put(protect, updateOrder).delete(protect, deleteOrder);

// Ruta para verificar si un pedido existe por su número de orden
router.route('/check/:orderNumber').get(protect, checkOrderExists);

module.exports = router;
