const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    // 👇 AÑADIMOS ESTE CAMPO
    role: {
      type: String,
      enum: ['user', 'admin'], // Solo permite estos dos valores
      default: 'user', // Por defecto, cualquier usuario nuevo será 'user'
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
