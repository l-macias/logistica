const User = require('../models/User.js');

const admin = async (req, res, next) => {
  // Este middleware debe ejecutarse DESPUÉS del middleware 'protect',
  // por lo que ya tendremos acceso a req.user.
  const user = await User.findById(req.user.id);

  if (user && user.role === 'admin') {
    next(); // Si es admin, continuamos
  } else {
    res.status(403); // 403 significa "Forbidden" o "Prohibido"
    throw new Error('Acceso denegado, no eres administrador');
  }
};

module.exports = { admin };
