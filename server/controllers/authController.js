const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Registrar un nuevo usuario (acción de administrador)
// @route   POST /api/auth/register
// @access  Public (eventualmente la protegeremos para que solo un admin pueda usarla)
const registerUser = async (req, res) => {
  // 👇 Obtenemos el rol del cuerpo de la petición
  const { username, password, role } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res
        .status(400)
        .json({ message: 'El nombre de usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 👇 Pasamos el rol al crear el usuario. Si no se especifica,
    // usará el valor por defecto 'user' del modelo.
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role, // Devolvemos también el rol
        message: 'Usuario creado exitosamente',
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error del servidor', error: error.message });
  }
};

// @desc    Autenticar (loguear) un usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        // 👇 Añadimos el rol al token
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          username: user.username,
          // 👇 Y lo más importante, añadimos el rol a la respuesta
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error del servidor', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
