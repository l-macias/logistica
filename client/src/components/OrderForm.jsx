import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../services/api';
import CreatableSelect from 'react-select/creatable';
import transportOptions from '../data/transportes.json';
import './OrderForm.css';

const OrderForm = ({ onOrderCreated }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [packer, setPacker] = useState('Alexis');
  const [deliveryType, setDeliveryType] = useState('Retira');
  const [deliveryDetail, setDeliveryDetail] = useState(null);
  const [packageCount, setPackageCount] = useState(1);
  const [isPallet, setIsPallet] = useState(false);

  const [rememberPacker, setRememberPacker] = useState(false);
  const [isDefaultDetail, setIsDefaultDetail] = useState(true);
  const [duplicateError, setDuplicateError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderNumberError, setOrderNumberError] = useState('');
  const armadores = ['Alexis', 'Matias', 'Nacho', 'Gaston'];
  const orderNumberInputRef = useRef(null);

  useEffect(() => {
    if (isDefaultDetail) {
      const defaultOption =
        deliveryType === 'Retira'
          ? { value: 'Cliente Retira', label: 'Cliente Retira' }
          : { value: 'Reparto Propio', label: 'Reparto Propio' };
      setDeliveryDetail(defaultOption);
    } else {
      setDeliveryDetail(null);
    }
  }, [isDefaultDetail, deliveryType]);

  useEffect(() => {
    if (rememberPacker) localStorage.setItem('rememberedPacker', packer);
  }, [packer, rememberPacker]);

  useEffect(() => {
    const savedPacker = localStorage.getItem('rememberedPacker');
    if (savedPacker) {
      setPacker(savedPacker);
      setRememberPacker(true);
    }
    orderNumberInputRef.current?.focus();
  }, []);

  const handleOrderNumberBlur = async () => {
    if (!orderNumber) return setDuplicateError('');
    if (orderNumber.length !== 6) return; // No buscamos duplicados si el número es inválido

    try {
      const { data } = await apiClient.get(`/orders/check/${orderNumber}`);
      setDuplicateError(data.exists ? data.message : '');
    } catch (err) {
      console.error('Error al verificar el pedido:', err);
    }
  };

  const normalizeTransportString = (type, detail) => {
    if (!detail || !detail.value) return type;
    const trimmedDetail = detail.value.trim();
    return `${type}: ${
      trimmedDetail.charAt(0).toUpperCase() + trimmedDetail.slice(1)
    }`;
  };

  const handleOrderNumberChange = (e) => {
    const value = e.target.value;
    setOrderNumber(value);

    if (value && value.length !== 6) {
      setOrderNumberError('El número de pedido debe tener 6 dígitos.');
    } else {
      setOrderNumberError(''); // Limpiamos el error si es correcto
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderNumber.length !== 6) {
      setOrderNumberError('El número de pedido debe tener 6 dígitos.');
      return; // Detenemos el envío
    }
    if (duplicateError) {
      console.log('❌ DETENIDO: Hay un error de pedido duplicado.');
      setError('No se puede guardar, el número de pedido ya existe.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (!deliveryDetail) {
      console.log("❌ DETENIDO: El campo 'Detalle' está vacío.");
      setError(
        'Por favor, especifique un detalle para la entrega (Transporte, Cliente, etc.)'
      );
      setTimeout(() => setError(''), 4000);
      return;
    }

    console.log('✅ Validaciones pasadas. Intentando enviar...');
    setMessage('');
    setError('');

    try {
      const newOrder = {
        orderNumber: Number(orderNumber),
        transport: normalizeTransportString(deliveryType, deliveryDetail),
        packer,
        packageCount: Number(packageCount),
        isPallet,
      };

      console.log('📦 Datos a enviar a la API:', newOrder);

      await apiClient.post('/orders', newOrder);

      console.log('🎉 ¡Éxito! Pedido guardado en la API.');
      setMessage(`¡Pedido ${orderNumber} guardado con éxito!`);

      setOrderNumber('');
      setIsPallet(false);
      setPackageCount(1);
      if (!rememberPacker) setPacker('Alexis');
      setIsDefaultDetail(true);

      if (onOrderCreated) {
        onOrderCreated();
      }
      orderNumberInputRef.current?.focus();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('🔥 ERROR en la llamada a la API:', err.response || err);
      setError(err.response?.data?.message || 'No se pudo guardar el pedido.');
      setTimeout(() => setError(''), 4000);
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
            ref={orderNumberInputRef}
            value={orderNumber}
            onChange={handleOrderNumberChange}
            onBlur={handleOrderNumberBlur}
            required
          />
          {duplicateError && (
            <p className="warning-message">{duplicateError}</p>
          )}
          {orderNumberError && (
            <p className="validation-error">{orderNumberError}</p>
          )}
        </div>

        <div className="form-group-inline transport-group">
          <div className="form-group">
            <label>Tipo de Entrega</label>
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
            >
              <option value="Retira">Retira</option>
              <option value="Reparto">Reparto</option>
            </select>
          </div>
          <div className="form-group-checkbox transport-default-checkbox">
            <input
              type="checkbox"
              id="isDefaultDetail"
              checked={isDefaultDetail}
              onChange={(e) => setIsDefaultDetail(e.target.checked)}
            />
            <label htmlFor="isDefaultDetail">
              {deliveryType === 'Retira' ? 'Cliente Retira' : 'Reparto Propio'}
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="deliveryDetail">
            {isDefaultDetail
              ? 'Detalle (Automático)'
              : 'Detalle (Transporte, Comisionista, etc.)'}
          </label>
          <CreatableSelect
            isClearable
            id="deliveryDetail"
            options={transportOptions}
            value={deliveryDetail}
            onChange={setDeliveryDetail}
            placeholder="Escribe o selecciona..."
            formatCreateLabel={(inputValue) => `Añadir "${inputValue}"`}
            isDisabled={isDefaultDetail}
          />
        </div>

        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="packageCount">Cantidad</label>
            <input
              type="number"
              id="packageCount"
              value={packageCount}
              onChange={(e) => setPackageCount(e.target.value)}
              min="1"
            />
          </div>
          <div className="form-group-checkbox pallet-checkbox">
            <input
              type="checkbox"
              id="isPallet"
              checked={isPallet}
              onChange={(e) => setIsPallet(e.target.checked)}
            />
            <label htmlFor="isPallet">Marcar si son Pallets</label>
          </div>
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
          disabled={!!duplicateError || !!orderNumberError}
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
