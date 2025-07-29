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

// --- Función Auxiliar para procesar estadísticas de un período ---
const processPeriodStats = async (startDate, endDate) => {
  const from = startOfDayArgentine(startDate);
  const to = endOfDayArgentine(endDate);

  const aggregationResult = await Order.aggregate([
    { $match: { timestamp: { $gte: from, $lte: to } } },
    {
      $facet: {
        totalOrders: [{ $count: 'count' }],
        byPacker: [
          {
            $group: {
              _id: '$packer',
              count: { $sum: 1 },
              totalPackages: {
                $sum: {
                  $cond: [{ $eq: ['$isPallet', false] }, '$packageCount', 0],
                },
              },
              totalPallets: {
                $sum: {
                  $cond: [{ $eq: ['$isPallet', true] }, '$packageCount', 0],
                },
              },
            },
          },
          { $sort: { count: -1 } },
        ],
        byUser: [
          {
            $group: {
              _id: '$closer',
              count: { $sum: 1 },
              totalPackages: {
                $sum: {
                  $cond: [{ $eq: ['$isPallet', false] }, '$packageCount', 0],
                },
              },
              totalPallets: {
                $sum: {
                  $cond: [{ $eq: ['$isPallet', true] }, '$packageCount', 0],
                },
              },
            },
          },
          { $sort: { count: -1 } },
        ],
        byTransport: [
          { $group: { _id: '$transport', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        totalPalletsGeneral: [
          { $match: { isPallet: true } },
          { $group: { _id: null, total: { $sum: '$packageCount' } } },
        ],
        totalPackagesGeneral: [
          { $match: { isPallet: false } },
          { $group: { _id: null, total: { $sum: '$packageCount' } } },
        ],
        ordersByDay: [
          {
            $group: {
              _id: {
                // Extraemos año, mes y día de la fecha en la zona horaria de Argentina
                year: {
                  $year: {
                    date: '$timestamp',
                    timezone: 'America/Argentina/Buenos_Aires',
                  },
                },
                month: {
                  $month: {
                    date: '$timestamp',
                    timezone: 'America/Argentina/Buenos_Aires',
                  },
                },
                day: {
                  $dayOfMonth: {
                    date: '$timestamp',
                    timezone: 'America/Argentina/Buenos_Aires',
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }, // Ordenamos por fecha
        ],
        deliveryTypeTotals: [
          {
            $group: {
              // Agrupamos condicionalmente si el string 'transport' empieza con "Retira" o "Reparto"
              _id: {
                $cond: [
                  { $regexMatch: { input: '$transport', regex: '^Retira' } },
                  'Retira',
                  'Reparto',
                ],
              },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const result = aggregationResult[0];
  const totalOrders = result.totalOrders[0]?.count || 0;
  const totalPallets = result.totalPalletsGeneral[0]?.total || 0;
  const totalPackages = result.totalPackagesGeneral[0]?.total || 0;

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
    summary: {
      totalOrders,
      dailyAverage: parseFloat(dailyAverage.toFixed(2)),
      totalPallets,
      totalPackages,
    },
    byPacker: result.byPacker,
    byUser: result.byUser,
    byTransport: transportWithPercentage,
    ordersByDay: result.ordersByDay,
    deliveryTypeTotals: result.deliveryTypeTotals,
  };
};

// --- Controlador Principal que maneja la lógica de comparación y detalles ---
const getDynamicStats = async (req, res) => {
  try {
    const { primaryPeriod, comparisonPeriod, includeDetails } = req.body;

    const primaryData = await processPeriodStats(
      primaryPeriod.startDate,
      primaryPeriod.endDate
    );

    let comparisonData = null;
    let details = [];

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

    if (includeDetails) {
      const from = startOfDayArgentine(primaryPeriod.startDate);
      const to = endOfDayArgentine(primaryPeriod.endDate);
      details = await Order.find({
        timestamp: { $gte: from, $lte: to },
      }).sort({ timestamp: -1 });
    }

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

// --- ESTA ES LA LÍNEA MÁS IMPORTANTE ---
// Asegúrate de que esta línea esté al final y sea la única exportación.
module.exports = {
  getDynamicStats,
};
