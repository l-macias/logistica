import React, { useState } from 'react';
import apiClient from '../services/api';
import './OrderItem.css';

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
        onOrderDeleted(order._id); // Notifica al componente padre para que lo quite de la lista
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
      onOrderUpdated(response.data); // Notifica al padre para que actualice la lista
      setIsEditing(false); // Salimos del modo edición
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
      <div className="order-info">
        <span>
          <strong>Nro:</strong> {order.orderNumber}
        </span>
        <span>
          <strong>Transporte:</strong> {order.transport}
        </span>
        <span>
          <strong>Armador:</strong> {order.packer}
        </span>
      </div>
      <div className="actions">
        <button onClick={() => setIsEditing(true)} className="btn-edit">
          Editar
        </button>
        <button onClick={handleDelete} className="btn-delete">
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default OrderItem;
