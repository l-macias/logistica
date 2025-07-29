import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import apiClient from '../services/api';
import transportOptions from '../data/transportes.json';
import './OrderItem.css';

const OrderItem = ({ order, onOrderDeleted, onOrderUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Estados para el formulario de edición
  const [editedOrderNumber, setEditedOrderNumber] = useState(order.orderNumber);
  const [deliveryType, setDeliveryType] = useState('');
  const [deliveryDetail, setDeliveryDetail] = useState(null);
  const [isDefaultDetail, setIsDefaultDetail] = useState(false);
  const [packageCount, setPackageCount] = useState(order.packageCount);
  const [isPallet, setIsPallet] = useState(order.isPallet);
  const [packer, setPacker] = useState(order.packer);
  const [duplicateError, setDuplicateError] = useState('');

  const armadores = ['Alexis', 'Matias', 'Nacho', 'Gaston'];

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: '#212529',
      backgroundColor: state.isFocused ? '#e9ecef' : 'white',
    }),
  };

  // Lógica para inicializar el formulario de edición
  const handleEnterEditMode = () => {
    const [type, ...detailParts] = order.transport.split(': ');
    const detailValue = detailParts.join(': ');

    setDeliveryType(type || 'Retira');
    setDeliveryDetail({ value: detailValue, label: detailValue });

    // Comprobamos si el detalle es el por defecto
    const isDefault =
      detailValue === 'Cliente Retira' || detailValue === 'Reparto Propio';
    setIsDefaultDetail(isDefault);

    setIsEditing(true);
  };

  // Lógica para el checkbox de detalle automático
  useEffect(() => {
    if (!isEditing) return;
    if (isDefaultDetail) {
      const defaultOption =
        deliveryType === 'Retira'
          ? { value: 'Cliente Retira', label: 'Cliente Retira' }
          : { value: 'Reparto Propio', label: 'Reparto Propio' };
      setDeliveryDetail(defaultOption);
    } else {
      // Si se desmarca, limpiamos el campo si era uno por defecto
      if (
        deliveryDetail?.value === 'Cliente Retira' ||
        deliveryDetail?.value === 'Reparto Propio'
      ) {
        setDeliveryDetail(null);
      }
    }
  }, [isDefaultDetail, deliveryType, isEditing]);

  const handleOrderNumberBlur = async () => {
    if (!editedOrderNumber || editedOrderNumber.toString().length !== 6)
      return setDuplicateError('');
    try {
      const { data } = await apiClient.get(
        `/orders/check/${editedOrderNumber}`
      );
      // Solo mostramos error si el número existe Y no es el del pedido que estamos editando
      if (data.exists && data.orderId.toString() !== order._id.toString()) {
        setDuplicateError(data.message);
      } else {
        setDuplicateError('');
      }
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (duplicateError) return;

    const updatedData = {
      orderNumber: Number(editedOrderNumber),
      transport: normalizeTransportString(deliveryType, deliveryDetail),
      packer,
      packageCount: Number(packageCount),
      isPallet,
    };

    try {
      const response = await apiClient.put(`/orders/${order._id}`, updatedData);
      onOrderUpdated(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el pedido:', error);
      alert('No se pudo actualizar el pedido.');
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `¿Seguro que quieres eliminar el pedido ${order.orderNumber}?`
      )
    ) {
      try {
        await apiClient.delete(`/orders/${order._id}`);
        onOrderDeleted(order._id);
      } catch (error) {
        console.error('Error al eliminar el pedido:', error);
      }
    }
  };

  // VISTA DE EDICIÓN
  if (isEditing) {
    return (
      <div className="order-item-editing-container">
        <form className="editing-form" onSubmit={handleUpdate}>
          <h4>Editando Pedido {order.orderNumber}</h4>

          <div className="form-group">
            <label>Nro de Pedido</label>
            <input
              type="number"
              value={editedOrderNumber}
              onChange={(e) => setEditedOrderNumber(e.target.value)}
              onBlur={handleOrderNumberBlur}
            />
            {duplicateError && (
              <p className="validation-error">{duplicateError}</p>
            )}
          </div>

          <div className="form-group-inline">
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
            <div className="form-group-checkbox">
              <input
                type="checkbox"
                id={`isDefault-${order._id}`}
                checked={isDefaultDetail}
                onChange={(e) => setIsDefaultDetail(e.target.checked)}
              />
              <label htmlFor={`isDefault-${order._id}`}>
                {deliveryType === 'Retira'
                  ? 'Cliente Retira'
                  : 'Reparto Propio'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Detalle</label>
            <CreatableSelect
              options={transportOptions}
              value={deliveryDetail}
              onChange={setDeliveryDetail}
              isDisabled={isDefaultDetail}
              styles={customStyles}
            />
          </div>

          <div className="form-group-inline">
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                value={packageCount}
                onChange={(e) => setPackageCount(e.target.value)}
                min="1"
              />
            </div>
            <div className="form-group-checkbox">
              <input
                type="checkbox"
                id={`isPallet-${order._id}`}
                checked={isPallet}
                onChange={(e) => setIsPallet(e.target.checked)}
              />
              <label htmlFor={`isPallet-${order._id}`}>Es Pallet</label>
            </div>
          </div>

          <div className="form-group">
            <label>Armador</label>
            <select value={packer} onChange={(e) => setPacker(e.target.value)}>
              {armadores.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="editing-actions">
            <button
              type="submit"
              className="btn-save"
              disabled={!!duplicateError}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-cancel"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // VISTA NORMAL
  return (
    <div className="order-item">
      <div className="order-info">
        <div className="info-item">
          <span className="info-label">Nro de Pedido</span>
          <span className="info-data">{order.orderNumber}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Transporte</span>
          <span className="info-data">{order.transport}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Armador</span>
          <span className="info-data">{order.packer}</span>
        </div>
      </div>
      <div className="actions">
        <span className="actions-label">Acciones</span>
        <div className="buttons-container">
          <button onClick={handleEnterEditMode} className="btn-edit">
            Editar
          </button>
          <button onClick={handleDelete} className="btn-delete">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
