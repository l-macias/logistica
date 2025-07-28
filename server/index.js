// 1. Importaciones
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- Importar nuestras rutas ---
const authRoutes = require('./routes/authRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const statsRoutes = require('./routes/statsRoutes.js');
// 2. Inicialización
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Conexión a la Base de Datos
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((error) => console.error('❌ Error al conectar a MongoDB:', error));

// 5. Rutas
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes); // <-- AÑADIMOS ESTA LÍNEA
app.use('/api/stats', statsRoutes);
app.get('/', (req, res) => {
  res.send('¡API de logística funcionando! 🚀');
});

// 6. Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
