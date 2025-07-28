const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Fecha y hora del pedido
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Nro de pedido (del formulario)
  orderNumber: {
    type: Number,
    required: true,
  },
  // Transporte (del formulario)
  transport: {
    type: String,
    required: true,
    trim: true,
  },
  // Armador (del formulario)
  packer: {
    type: String,
    required: true,
    enum: ['Alexis', 'Matias', 'Nacho', 'Gaston'], // Solo permite estos valores
  },
  // Cerrador (usuario logueado)
  closer: {
    type: String,
    required: true,
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
