import React from 'react';
import { format } from 'date-fns';
import './OrderDetailsModal.css';

const OrderDetailsModal = ({ order, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn">
          &times;
        </button>
        <h2>Detalle del Pedido: {order.orderNumber}</h2>
        <ul className="details-list">
          <li>
            <strong>Fecha y Hora:</strong>
            <span>{format(new Date(order.timestamp), 'dd/MM/yyyy HH:mm')}</span>
          </li>
          <li>
            <strong>Transporte:</strong>
            <span>{order.transport}</span>
          </li>
          <li>
            <strong>Armador:</strong>
            <span>{order.packer}</span>
          </li>
          <li>
            <strong>Cerrador:</strong>
            <span>{order.closer || 'No especificado'}</span>
          </li>
          <li>
            <strong>Bultos:</strong>
            <span>{order.packageCount}</span>
          </li>
          <li>
            <strong>Pallets:</strong>
            <span>{order.isPallet ? 'Sí' : 'No'}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
