const Order = require('../models/Order.js');

// --- La función createOrder que ya teníamos ---
const createOrder = async (req, res) => {
  try {
    const { orderNumber, transport, packer } = req.body;
    if (!orderNumber || !transport || !packer) {
      return res
        .status(400)
        .json({ message: 'Por favor, complete todos los campos' });
    }
    const order = new Order({
      orderNumber,
      transport,
      packer,
      closer: req.user.username,
    });
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ message: 'Error del servidor al crear el pedido' });
  }
};

// --- La función getOrders que ya teníamos (la dejamos para el admin) ---
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    res
      .status(500)
      .json({ message: 'Error del servidor al obtener los pedidos' });
  }
};

// --- NUEVA FUNCIÓN ---
// @desc    Obtener los pedidos del día del usuario logueado
// @route   GET /api/orders/today
// @access  Private
const getTodayUserOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establece la hora al inicio del día

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Establece la hora al inicio del día siguiente

    const orders = await Order.find({
      closer: req.user.username, // Solo los del usuario logueado
      timestamp: {
        $gte: today, // Mayor o igual que el inicio de hoy
        $lt: tomorrow, // Menor que el inicio de mañana
      },
    }).sort({ timestamp: -1 }); // Los más nuevos primero

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos del día:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// --- NUEVA FUNCIÓN ---
// @desc    Actualizar un pedido
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificación de seguridad: solo el usuario que lo creó puede editarlo
    if (order.closer !== req.user.username) {
      return res
        .status(401)
        .json({ message: 'No autorizado para editar este pedido' });
    }

    const { orderNumber, transport, packer } = req.body;
    order.orderNumber = orderNumber || order.orderNumber;
    order.transport = transport || order.transport;
    order.packer = packer || order.packer;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// --- NUEVA FUNCIÓN ---
// @desc    Eliminar un pedido
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificación de seguridad: solo el usuario que lo creó puede eliminarlo
    if (order.closer !== req.user.username) {
      return res
        .status(401)
        .json({ message: 'No autorizado para eliminar este pedido' });
    }

    await order.deleteOne(); // Usamos deleteOne() en Mongoose v6+
    res.json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el pedido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
const checkOrderExists = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (order) {
      // Si se encuentra un pedido, devolvemos 'exists: true'
      res.json({
        exists: true,
        message: 'Este número de pedido ya fue cargado.',
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};
// Exportamos todas las funciones
module.exports = {
  createOrder,
  getOrders,
  getTodayUserOrders,
  updateOrder,
  deleteOrder,
  checkOrderExists,
};
