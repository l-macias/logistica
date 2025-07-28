const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // El token viene en los headers de la petición así: 'Bearer TOKEN'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Obtenemos el token del header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificamos el token con nuestra clave secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Adjuntamos los datos del usuario decodificado a la petición (sin la contraseña)
      // Esto estará disponible en todas las rutas protegidas
      req.user = decoded;

      next(); // Si todo va bien, continuamos a la siguiente función (el controlador)
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'No autorizado, token falló' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

module.exports = { protect };
