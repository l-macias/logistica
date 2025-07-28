import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import OrderItem from '../components/OrderItem';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/orders/today');
        setOrders(response.data);
      } catch (err) {
        setError('No se pudieron cargar los pedidos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleOrderDeleted = (orderId) => {
    setOrders(orders.filter((order) => order._id !== orderId));
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(
      orders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  if (loading) return <div className="page-container">Cargando pedidos...</div>;
  if (error) return <div className="page-container error-message">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mis Pedidos del Día</h1>
        <Link to="/" className="btn-back">
          Volver al inicio
        </Link>
      </div>

      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderItem
              key={order._id}
              order={order}
              onOrderDeleted={handleOrderDeleted}
              onOrderUpdated={handleOrderUpdated}
            />
          ))
        ) : (
          <p className="no-orders-message">No has cargado ningún pedido hoy.</p>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
