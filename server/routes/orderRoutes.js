const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getTodayUserOrders,
  updateOrder,
  deleteOrder,
  checkOrderExists,
  getTodaySummary,
  getOrderByNumber,
  searchOrdersByPrefix,
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

// Ruta para obtener un pedido por su número de orden
router.route('/by-number/:orderNumber').get(protect, getOrderByNumber);

// Ruta para buscar pedidos por prefijo
router.route('/search-by-prefix').get(protect, searchOrdersByPrefix);

// Ruta para el resumen en tiempo real del dashboard de usuario
router.route('/summary/today').get(protect, getTodaySummary);

module.exports = router;
