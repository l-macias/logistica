const Order = require('../models/Order.js');

// Función para obtener inicio del día en UTC para una fecha argentina
const startOfDayArgentine = (date) => {
  const localDate = new Date(date + 'T00:00:00.000');
  return new Date(localDate.getTime() + 3 * 60 * 60 * 1000);
};

// Función para obtener fin del día en UTC para una fecha argentina
const endOfDayArgentine = (date) => {
  const localDate = new Date(date + 'T23:59:59.999');
  return new Date(localDate.getTime() + 3 * 60 * 60 * 1000);
};

// --- Crear un nuevo pedido ---
const createOrder = async (req, res) => {
  try {
    const { orderNumber, transport, packer, packageCount, isPallet } = req.body;

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
      packageCount: Number(packageCount),
      isPallet,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ message: 'Error del servidor al crear el pedido' });
  }
};

// --- Obtener todos los pedidos (para el futuro panel de admin) ---
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

// --- Obtener los pedidos del día del usuario logueado ---
const getTodayUserOrders = async (req, res) => {
  try {
    const today = new Date();
    const from = startOfDayArgentine(today.toISOString().split('T')[0]);
    const to = endOfDayArgentine(today.toISOString().split('T')[0]);

    const orders = await Order.find({
      closer: req.user.username,
      timestamp: {
        $gte: from,
        $lt: to,
      },
    }).sort({ timestamp: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos del día:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// --- Actualizar un pedido ---
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

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

// --- Eliminar un pedido ---
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (order.closer !== req.user.username) {
      return res
        .status(401)
        .json({ message: 'No autorizado para eliminar este pedido' });
    }

    await order.deleteOne();
    res.json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el pedido:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// --- Verificar si un número de pedido ya existe ---
const checkOrderExists = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (order) {
      res.json({
        exists: true,
        message: 'Este número de pedido ya fue cargado.',
        orderId: order._id, // <-- AÑADIMOS LA ID
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// --- NUEVA FUNCIÓN PARA EL DASHBOARD EN TIEMPO REAL ---
const getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    const from = startOfDayArgentine(today.toISOString().split('T')[0]);
    const to = endOfDayArgentine(today.toISOString().split('T')[0]);

    const summary = await Order.aggregate([
      { $match: { timestamp: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$closer',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Error al obtener el resumen del día:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// --- NUEVA FUNCIÓN PARA BUSCAR UN PEDIDO POR NÚMERO ---
const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });

    if (order) {
      res.json(order);
    } else {
      // Si no se encuentra el pedido, devolvemos un 404
      res.status(404).json({ message: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error al buscar el pedido por número:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
const searchOrdersByPrefix = async (req, res) => {
  const { prefix } = req.query;

  if (!prefix || prefix.length < 4 || isNaN(prefix)) {
    return res.status(400).json({
      message:
        'El prefijo de búsqueda debe ser un número de al menos 4 dígitos.',
    });
  }

  try {
    // Convertimos el prefijo a número para el cálculo
    const prefixNum = parseInt(prefix, 10);

    // Calculamos el rango numérico para la búsqueda.
    // Ejemplo: si el prefijo es 1234, buscamos entre 123400 y 123499.
    const remainingDigits = 6 - prefix.length;
    const lowerBound = prefixNum * Math.pow(10, remainingDigits);
    const upperBound = lowerBound + Math.pow(10, remainingDigits) - 1;

    // Usamos el rango en la consulta, que es la forma correcta para campos numéricos
    const orders = await Order.find({
      orderNumber: { $gte: lowerBound, $lte: upperBound },
    }).limit(10); // Limitamos a 10 resultados para no sobrecargar

    res.json(orders);
  } catch (error) {
    console.error('Error en la búsqueda por prefijo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
module.exports = {
  createOrder,
  getOrders,
  getTodayUserOrders,
  updateOrder,
  deleteOrder,
  checkOrderExists,
  getTodaySummary,
  getOrderByNumber,
  searchOrdersByPrefix,
};
