import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../services/api';
import './OrderForm.css';

const OrderForm = ({ onOrderCreated }) => {
  // Estados del formulario
  const [orderNumber, setOrderNumber] = useState('');
  const [transport, setTransport] = useState('');
  const [packer, setPacker] = useState('Alexis');

  // Estados para las nuevas funcionalidades
  const [rememberPacker, setRememberPacker] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

  // Estados para mensajes de feedback
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const armadores = ['Alexis', 'Matias', 'Nacho', 'Gaston'];
  const transportInputRef = useRef(null); // Ref para manejar el "Enter"

  // 1) Lógica para recordar el armador
  useEffect(() => {
    if (rememberPacker) {
      // Si se marca el check, guardamos el armador actual en localStorage
      localStorage.setItem('rememberedPacker', packer);
    }
  }, [packer, rememberPacker]);

  useEffect(() => {
    // Al cargar el componente, vemos si hay un armador guardado
    const savedPacker = localStorage.getItem('rememberedPacker');
    if (savedPacker) {
      setPacker(savedPacker);
      setRememberPacker(true); // Marcamos el check si había algo guardado
    }
  }, []);

  // 3) Lógica para verificar número de pedido duplicado
  const handleOrderNumberBlur = async () => {
    if (!orderNumber) {
      setDuplicateError('');
      return;
    }
    try {
      const { data } = await apiClient.get(`/orders/check/${orderNumber}`);
      if (data.exists) {
        setDuplicateError(data.message);
      } else {
        setDuplicateError('');
      }
    } catch (err) {
      console.error('Error al verificar el pedido:', err);
      setDuplicateError(''); // No bloqueamos al usuario si la API falla
    }
  };

  // 2) Función para normalizar el texto del transporte
  const normalizeTransport = (text) => {
    if (!text) return '';
    const trimmedText = text.trim(); // Quita espacios al inicio y final
    return (
      trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1).toLowerCase()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duplicateError) {
      setError('No se puede guardar, el número de pedido ya existe.');
      return;
    }

    setMessage('');
    setError('');

    try {
      const newOrder = {
        orderNumber: Number(orderNumber),
        transport: normalizeTransport(transport), // Usamos el texto normalizado
        packer,
      };
      await apiClient.post('/orders', newOrder);
      setMessage(`¡Pedido ${orderNumber} guardado con éxito!`);

      // Limpiamos el formulario
      setOrderNumber('');
      setTransport('');
      if (!rememberPacker) {
        setPacker('Alexis'); // Solo reseteamos el armador si no está marcado el check
      }

      if (onOrderCreated) {
        onOrderCreated();
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el pedido.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 1) Lógica para el "Enter" en el campo de transporte
  const handleTransportKeyDown = (e) => {
    if (e.key === 'Enter' && rememberPacker) {
      e.preventDefault(); // Evita el comportamiento por defecto del Enter
      handleSubmit(e);
    }
  };

  return (
    <div className="form-container">
      <h2>Cargar Nuevo Pedido</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="orderNumber">Nro de Pedido</label>
          <input
            type="number"
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onBlur={handleOrderNumberBlur} // Verificamos al quitar el foco
            required
          />
          {duplicateError && (
            <p className="warning-message">{duplicateError}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="transport">Transporte</label>
          <input
            type="text"
            id="transport"
            ref={transportInputRef}
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            onKeyDown={handleTransportKeyDown} // Manejamos el Enter
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="packer">Armador</label>
          <select
            id="packer"
            value={packer}
            onChange={(e) => setPacker(e.target.value)}
            required
          >
            {armadores.map((armador) => (
              <option key={armador} value={armador}>
                {armador}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group-checkbox">
          <input
            type="checkbox"
            id="rememberPacker"
            checked={rememberPacker}
            onChange={(e) => setRememberPacker(e.target.checked)}
          />
          <label htmlFor="rememberPacker">
            Recordar armador para la próxima carga
          </label>
        </div>
        <button
          type="submit"
          className="btn-submit"
          disabled={!!duplicateError}
        >
          Guardar Pedido
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default OrderForm;
