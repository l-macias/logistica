const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  orderNumber: {
    type: Number,
    required: true,
  },
  transport: {
    type: String,
    required: true,
    trim: true,
  },
  packer: {
    type: String,
    required: true,
    enum: ['Alexis', 'Matias', 'Nacho', 'Gaston'],
  },
  closer: {
    type: String,
    required: true,
  },
  packageCount: {
    type: Number,
    default: 0,
  },
  isPallet: {
    type: Boolean,
    default: false,
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
