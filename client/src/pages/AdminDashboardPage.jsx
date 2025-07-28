import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import DatePicker from 'react-datepicker';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';

import StatsList from '../components/StatsList';
import CreateUserForm from '../components/CreateUserForm';
import Modal from '../components/Modal';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  // Estados para el período principal
  const [primaryStartDate, setPrimaryStartDate] = useState(
    startOfMonth(new Date())
  );
  const [primaryEndDate, setPrimaryEndDate] = useState(endOfMonth(new Date()));

  // Estados para el período de comparación
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
  const [compStartDate, setCompStartDate] = useState(
    startOfMonth(subMonths(new Date(), 1))
  );
  const [compEndDate, setCompEndDate] = useState(
    endOfMonth(subMonths(new Date(), 1))
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const payload = {
      primaryPeriod: {
        startDate: format(primaryStartDate, 'yyyy-MM-dd'),
        endDate: format(primaryEndDate, 'yyyy-MM-dd'),
      },
      includeDetails: true,
    };

    if (isComparisonEnabled) {
      payload.comparisonPeriod = {
        startDate: format(compStartDate, 'yyyy-MM-dd'),
        endDate: format(compEndDate, 'yyyy-MM-dd'),
      };
    }

    try {
      const { data } = await apiClient.post('/stats/query', payload);
      setStats(data);
    } catch (error) {
      console.error('Error al cargar las estadísticas', error);
    } finally {
      setLoading(false);
    }
  }, [
    primaryStartDate,
    primaryEndDate,
    isComparisonEnabled,
    compStartDate,
    compEndDate,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const setDateRange = (period) => {
    const today = new Date();
    if (period === 'today') {
      setPrimaryStartDate(today);
      setPrimaryEndDate(today);
    } else if (period === 'yesterday') {
      const yesterday = subDays(today, 1);
      setPrimaryStartDate(yesterday);
      setPrimaryEndDate(yesterday);
    } else if (period === 'this_month') {
      setPrimaryStartDate(startOfMonth(today));
      setPrimaryEndDate(endOfMonth(today));
    } else if (period === 'last_month') {
      const lastMonth = subMonths(today, 1);
      setPrimaryStartDate(startOfMonth(lastMonth));
      setPrimaryEndDate(endOfMonth(lastMonth));
    }
  };

  const getPercentageDiff = (primary, comparison) => {
    if (comparison === 0) return { value: 'N/A', className: '' };
    const diff = ((primary - comparison) / comparison) * 100;
    const className = diff >= 0 ? 'positive' : 'negative';
    return { value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, className };
  };

  const prepareChartData = (data, label) => {
    if (!data || data.length === 0) return null;
    return {
      labels: data.map((item) => item.name || item._id),
      datasets: [
        {
          label,
          data: data.map((item) => item.count),
          backgroundColor: [
            'rgba(10, 45, 77, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(220, 53, 69, 0.8)',
            'rgba(25, 135, 84, 0.8)',
            'rgba(108, 117, 125, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1,
        },
      ],
    };
  };

  const handleExportToExcel = () => {
    if (!stats || !stats.details || stats.details.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const dataToExport = stats.details.map((order) => ({
      'Fecha y Hora': format(new Date(order.timestamp), 'dd/MM/yyyy HH:mm'),
      'Nro Pedido': order.orderNumber,
      Transporte: order.transport,
      Armador: order.packer,
      Cerrador: order.closer,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

    const fileName = `Reporte_Pedidos_${format(
      primaryStartDate,
      'dd-MM-yy'
    )}_al_${format(primaryEndDate, 'dd-MM-yy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <>
      <div className="admin-container">
        <div className="admin-header">
          <h1>Panel de Administrador</h1>
          <div className="header-nav-buttons">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-create-user"
            >
              Crear Nuevo Usuario
            </button>
            <Link to="/" className="btn-back">
              Volver al Inicio
            </Link>
          </div>
        </div>

        <div className="controls-container">
          <div className="date-controls">
            <div className="quick-filters">
              <button onClick={() => setDateRange('today')}>Hoy</button>
              <button onClick={() => setDateRange('yesterday')}>Ayer</button>
              <button onClick={() => setDateRange('this_month')}>
                Este Mes
              </button>
              <button onClick={() => setDateRange('last_month')}>
                Mes Pasado
              </button>
            </div>
            <div className="date-pickers">
              <div className="datepicker-group">
                <label>Período Principal:</label>
                <DatePicker
                  selected={primaryStartDate}
                  onChange={(date) => setPrimaryStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                />
                <DatePicker
                  selected={primaryEndDate}
                  onChange={(date) => setPrimaryEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div className="comparison-toggle">
                <input
                  type="checkbox"
                  id="compare"
                  checked={isComparisonEnabled}
                  onChange={(e) => setIsComparisonEnabled(e.target.checked)}
                />
                <label htmlFor="compare">Comparar con otro período</label>
              </div>
              {isComparisonEnabled && (
                <div className="datepicker-group">
                  <label>Período de Comparación:</label>
                  <DatePicker
                    selected={compStartDate}
                    onChange={(date) => setCompStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                  />
                  <DatePicker
                    selected={compEndDate}
                    onChange={(date) => setCompEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn-consultar"
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        {loading ? (
          <p>Cargando datos...</p>
        ) : stats && stats.primaryData ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Pedidos</h4>
                <p>{stats.primaryData.summary.totalOrders}</p>
                {stats.comparisonData && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        stats.primaryData.summary.totalOrders,
                        stats.comparisonData.summary.totalOrders
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        stats.primaryData.summary.totalOrders,
                        stats.comparisonData.summary.totalOrders
                      ).value
                    }
                  </span>
                )}
              </div>
              <div className="stat-card">
                <h4>Promedio Diario</h4>
                <p>{stats.primaryData.summary.dailyAverage}</p>
                {stats.comparisonData && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        stats.primaryData.summary.dailyAverage,
                        stats.comparisonData.summary.dailyAverage
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        stats.primaryData.summary.dailyAverage,
                        stats.comparisonData.summary.dailyAverage
                      ).value
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="reports-grid">
              {stats.primaryData.byPacker.length > 0 && (
                <div className="report-item-full">
                  <div className="report-chart">
                    <BarChart
                      chartData={prepareChartData(
                        stats.primaryData.byPacker,
                        'Pedidos'
                      )}
                      title="Rendimiento por Armador"
                    />
                  </div>
                  <div className="report-list">
                    <StatsList
                      data={stats.primaryData.byPacker}
                      total={stats.primaryData.summary.totalOrders}
                    />
                  </div>
                </div>
              )}

              {stats.primaryData.byUser.length > 0 && (
                <div className="report-item-full">
                  <div className="report-chart">
                    <BarChart
                      chartData={prepareChartData(
                        stats.primaryData.byUser,
                        'Pedidos'
                      )}
                      title="Pedidos por Cerrador"
                    />
                  </div>
                  <div className="report-list">
                    <StatsList
                      data={stats.primaryData.byUser}
                      total={stats.primaryData.summary.totalOrders}
                    />
                  </div>
                </div>
              )}

              {stats.primaryData.byTransport.length > 0 && (
                <div className="report-item-full">
                  <div className="report-chart">
                    <DoughnutChart
                      chartData={prepareChartData(
                        stats.primaryData.byTransport,
                        'Pedidos'
                      )}
                      title="Distribución por Transporte"
                    />
                  </div>
                  <div className="report-list">
                    <StatsList
                      data={stats.primaryData.byTransport}
                      total={stats.primaryData.summary.totalOrders}
                    />
                  </div>
                </div>
              )}
            </div>

            {stats.details && stats.details.length > 0 && (
              <div className="details-container">
                <div className="details-header">
                  <h3>
                    Detalle de Pedidos del Período (
                    {format(primaryStartDate, 'dd/MM/yyyy')} -{' '}
                    {format(primaryEndDate, 'dd/MM/yyyy')})
                  </h3>
                  <button onClick={handleExportToExcel} className="btn-export">
                    Exportar a Excel
                  </button>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha y Hora</th>
                        <th>Nro Pedido</th>
                        <th>Transporte</th>
                        <th>Armador</th>
                        <th>Cerrador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.details.map((order) => (
                        <tr key={order._id}>
                          <td>
                            {format(
                              new Date(order.timestamp),
                              'dd/MM/yyyy HH:mm'
                            )}
                          </td>
                          <td>{order.orderNumber}</td>
                          <td>{order.transport}</td>
                          <td>{order.packer}</td>
                          <td>{order.closer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <p>No se encontraron datos para el período seleccionado.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateUserForm onUserCreated={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
};

export default AdminDashboardPage;
