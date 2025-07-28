import React, { useState } from 'react';
import apiClient from '../services/api';
import './CreateUserForm.css';

// 👇 Recibimos la nueva prop 'onUserCreated'
const CreateUserForm = ({ onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await apiClient.post('/auth/register', { username, password });
      setMessage(`¡Usuario ${username} creado con éxito!`);
      setUsername('');
      setPassword('');

      // 👇 Llamamos a la función para cerrar el modal después de 2 segundos
      setTimeout(() => {
        onUserCreated();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el usuario.');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="admin-widget">
      <h3>Crear Nuevo Usuario</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="new-username">Nombre de Usuario</label>
          <input
            type="text"
            id="new-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="new-password">Contraseña Temporal</label>
          <input
            type="password"
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-submit">
          Crear Usuario
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CreateUserForm;
