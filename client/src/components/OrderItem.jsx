import React, { useState } from 'react';
import apiClient from '../services/api';
import './OrderItem.css'; // 👇 ¡Esta es la línea que faltaba!

const OrderItem = ({ order, onOrderDeleted, onOrderUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...order });

  const armadores = ['Alexis', 'Matias', 'Nacho', 'Gaston'];

  const handleDelete = async () => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el pedido Nro ${order.orderNumber}?`
      )
    ) {
      try {
        await apiClient.delete(`/orders/${order._id}`);
        onOrderDeleted(order._id);
      } catch (error) {
        console.error('Error al eliminar el pedido:', error);
        alert('No se pudo eliminar el pedido.');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/orders/${order._id}`, {
        orderNumber: Number(editedData.orderNumber),
        transport: editedData.transport,
        packer: editedData.packer,
      });
      onOrderUpdated(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el pedido:', error);
      alert('No se pudo actualizar el pedido.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };

  if (isEditing) {
    return (
      <form className="order-item editing" onSubmit={handleUpdate}>
        <input
          type="number"
          name="orderNumber"
          value={editedData.orderNumber}
          onChange={handleInputChange}
          className="edit-input"
        />
        <input
          type="text"
          name="transport"
          value={editedData.transport}
          onChange={handleInputChange}
          className="edit-input"
        />
        <select
          name="packer"
          value={editedData.packer}
          onChange={handleInputChange}
          className="edit-input"
        >
          {armadores.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <div className="actions">
          <button type="submit" className="btn-save">
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
    );
  }

  return (
    <div className="order-item">
      {/* 👇 INICIO DE LA SECCIÓN MODIFICADA 👇 */}
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
          <button onClick={() => setIsEditing(true)} className="btn-edit">
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
