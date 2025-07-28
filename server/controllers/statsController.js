const Order = require('../models/Order.js');

// Función para obtener inicio del día en UTC para una fecha argentina
const startOfDayArgentine = (date) => {
  // Cuando el usuario dice "28/07", quiere desde las 00:00 del 28/07 hora argentina
  // 28/07 00:00 ART = 28/07 03:00 UTC (porque ART = UTC-3)
  const localDate = new Date(date + 'T00:00:00.000');
  // Como Argentina está UTC-3, sumamos 3 horas para obtener el equivalente UTC
  return new Date(localDate.getTime() + 3 * 60 * 60 * 1000);
};

// Función para obtener fin del día en UTC para una fecha argentina
const endOfDayArgentine = (date) => {
  // Cuando el usuario dice "28/07", quiere hasta las 23:59 del 28/07 hora argentina
  // 28/07 23:59 ART = 29/07 02:59 UTC (porque ART = UTC-3)
  const localDate = new Date(date + 'T23:59:59.999');
  // Como Argentina está UTC-3, sumamos 3 horas para obtener el equivalente UTC
  return new Date(localDate.getTime() + 3 * 60 * 60 * 1000);
};

// --- Función Auxiliar para procesar estadísticas de un período ---
const processPeriodStats = async (startDate, endDate) => {
  // Convertimos las fechas argentinas a UTC para la consulta
  const from = startOfDayArgentine(startDate);
  const to = endOfDayArgentine(endDate);

  const aggregationResult = await Order.aggregate([
    { $match: { timestamp: { $gte: from, $lte: to } } },
    {
      $facet: {
        totalOrders: [{ $count: 'count' }],
        byPacker: [
          { $group: { _id: '$packer', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byUser: [
          { $group: { _id: '$closer', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byTransport: [
          { $group: { _id: '$transport', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      },
    },
  ]);

  const result = aggregationResult[0];
  const totalOrders = result.totalOrders[0]?.count || 0;

  const diffTime = Math.abs(to - from);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const dailyAverage = totalOrders > 0 ? totalOrders / diffDays : 0;

  const transportWithPercentage = result.byTransport.map((item) => ({
    name: item._id,
    count: item.count,
    percentage: totalOrders > 0 ? (item.count / totalOrders) * 100 : 0,
  }));

  return {
    query: { startDate, endDate, totalDays: diffDays },
    summary: { totalOrders, dailyAverage: parseFloat(dailyAverage.toFixed(2)) },
    byPacker: result.byPacker,
    byUser: result.byUser,
    byTransport: transportWithPercentage,
  };
};

// --- Controlador Principal que maneja la lógica de comparación y detalles ---
const getDynamicStats = async (req, res) => {
  try {
    const { primaryPeriod, comparisonPeriod, includeDetails } = req.body;

    // 1. Procesar el período principal (siempre presente)
    const primaryData = await processPeriodStats(
      primaryPeriod.startDate,
      primaryPeriod.endDate
    );

    let comparisonData = null;
    let details = [];

    // 2. Procesar el período de comparación (si existe)
    if (
      comparisonPeriod &&
      comparisonPeriod.startDate &&
      comparisonPeriod.endDate
    ) {
      comparisonData = await processPeriodStats(
        comparisonPeriod.startDate,
        comparisonPeriod.endDate
      );
    }

    // 3. Obtener el detalle de pedidos (si se solicita)
    if (includeDetails) {
      const from = startOfDayArgentine(primaryPeriod.startDate);
      const to = endOfDayArgentine(primaryPeriod.endDate);
      details = await Order.find({
        timestamp: { $gte: from, $lte: to },
      }).sort({ timestamp: -1 });
    }

    // 4. Enviar la respuesta completa
    res.json({
      primaryData,
      comparisonData,
      details,
    });
  } catch (error) {
    console.error('Error al generar estadísticas dinámicas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getDynamicStats,
};
