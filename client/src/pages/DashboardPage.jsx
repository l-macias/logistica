import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import OrderForm from '../components/OrderForm';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState([]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/orders/summary/today');
      setSummary(data);
    } catch (error) {
      console.error('Error al cargar el resumen del día:', error);
    }
  }, []);

  useEffect(() => {
    fetchSummary(); // Carga inicial
    const interval = setInterval(fetchSummary, 15000); // Actualiza cada 15 segundos
    return () => clearInterval(interval); // Limpia el intervalo al salir
  }, [fetchSummary]);

  const myStats = summary.find((item) => item._id === user?.username);
  const topScore =
    summary.length > 0 ? Math.max(...summary.map((item) => item.count)) : 0;

  let myCardClass = 'stats-card-main';
  if (myStats) {
    if (myStats.count >= topScore && topScore > 0) {
      myCardClass += ' green';
    } else if (myStats.count < topScore) {
      myCardClass += ' red';
    }
  }

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="header-content">
          <span className="welcome-user">
            Bienvenido, <strong>{user?.username}</strong>
          </span>
          <div className="header-actions">
            {user && user.role === 'admin' && (
              <Link to="/admin" className="btn-admin">
                Panel de Admin
              </Link>
            )}
            <Link to="/mis-pedidos" className="btn-link">
              Ver mis pedidos del día
            </Link>
            <button onClick={logout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="sidebar-stats">
          <h4>Resumen del Día</h4>
          <div className="live-stats-container">
            {myStats ? (
              <div className={myCardClass}>
                <h3>Pedidos de {user?.username}</h3>
                <p className="count">{myStats.count}</p>
              </div>
            ) : (
              // Muestra una tarjeta para el usuario aunque no tenga pedidos
              <div className="stats-card-main">
                <h3>Pedidos de {user?.username}</h3>
                <p className="count">0</p>
              </div>
            )}

            {summary
              .filter((item) => item._id !== user?.username)
              .map((otherUser) => (
                <div key={otherUser._id} className="stats-card-other">
                  <h3>Pedidos de {otherUser._id}</h3>
                  <p className="count-other">{otherUser.count}</p>
                </div>
              ))}
          </div>
        </aside>

        <div className="main-content">
          <OrderForm onOrderCreated={fetchSummary} />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
