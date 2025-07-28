import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import OrderForm from '../components/OrderForm';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [dailyCount, setDailyCount] = useState(0);

  const fetchDailyCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.get('/orders/today');
      setDailyCount(response.data.length);
    } catch (error) {
      console.error('No se pudieron cargar los pedidos del día:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchDailyCount();
  }, [fetchDailyCount]);

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
        <div className="stats-card">
          <h3>Pedidos Cargados Hoy</h3>
          <p className="count">{dailyCount}</p>
        </div>
        <OrderForm onOrderCreated={fetchDailyCount} />
      </main>
    </div>
  );
};

export default DashboardPage;
