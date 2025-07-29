import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import DatePicker from 'react-datepicker';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
} from 'date-fns';
import * as XLSX from 'xlsx';

import StatsList from '../components/StatsList';
import CreateUserForm from '../components/CreateUserForm';
import Modal from '../components/Modal';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import LineChart from '../components/charts/LineChart';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [primaryStartDate, setPrimaryStartDate] = useState(
    startOfMonth(new Date())
  );
  const [primaryEndDate, setPrimaryEndDate] = useState(endOfMonth(new Date()));
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
  const [activeFilter, setActiveFilter] = useState('this_month');
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
    setActiveFilter(period);
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
    if (!comparison || comparison === 0) return { value: '', className: '' };
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

  const prepareFullDateRangeChartData = (startDate, endDate, data) => {
    if (!data) return null;
    const dataMap = new Map();
    data.forEach((item) => {
      const dateLabel = `${String(item._id.day).padStart(2, '0')}/${String(
        item._id.month
      ).padStart(2, '0')}`;
      dataMap.set(dateLabel, item.count);
    });
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const labels = allDays.map((day) => format(day, 'dd/MM'));
    const dataPoints = labels.map((label) => dataMap.get(label) || 0);
    return {
      labels,
      datasets: [
        {
          label: 'Pedidos por Día',
          data: dataPoints,
          borderColor: 'rgba(10, 45, 77, 1)',
          backgroundColor: 'rgba(10, 45, 77, 0.8)',
          tension: 0.1,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(10, 45, 77, 1)',
        },
      ],
    };
  };

  const handleExportToExcel = () => {
    if (!stats || !stats.details || stats.details.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const dataToExport = stats.details.map((order) => {
      const [tipo, ...detalleParts] = (order.transport || '').split(': ');
      const detalle = detalleParts.join(': ');
      return {
        'Fecha y Hora': format(new Date(order.timestamp), 'dd/MM/yyyy HH:mm'),
        'Nro Pedido': order.orderNumber,
        Transporte: tipo,
        Detalle: detalle,
        Armador: order.packer,
        Cerrador: order.closer,
        Bultos: order.packageCount,
        'Es Pallet': order.isPallet ? 'Sí' : 'No',
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');
    const fileName = `Reporte_Pedidos_${format(
      primaryStartDate,
      'dd-MM-yy'
    )}_al_${format(primaryEndDate, 'dd-MM-yy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const transportStats = useMemo(() => {
    if (!stats?.primaryData?.byTransport) {
      return { chartData: null, listData: null };
    }
    const totals = {
      Reparto: 0,
      Retira: 0,
      repartoPropio: 0,
      repartoTransporte: 0,
      retiraCliente: 0,
      retiraComisionista: 0,
    };
    for (const item of stats.primaryData.byTransport) {
      if (item.name.startsWith('Reparto')) {
        totals.Reparto += item.count;
        if (item.name === 'Reparto: Reparto Propio') {
          totals.repartoPropio += item.count;
        } else {
          totals.repartoTransporte += item.count;
        }
      } else if (item.name.startsWith('Retira')) {
        totals.Retira += item.count;
        if (item.name === 'Retira: Cliente Retira') {
          totals.retiraCliente += item.count;
        } else {
          totals.retiraComisionista += item.count;
        }
      }
    }
    const chartData = {
      labels: ['Reparto', 'Retira'],
      datasets: [
        {
          label: 'Pedidos',
          data: [totals.Reparto, totals.Retira],
          backgroundColor: ['rgba(10, 45, 77, 0.8)', 'rgba(255, 193, 7, 0.8)'],
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1,
        },
      ],
    };
    const listData = [
      { name: 'Reparto Propio', count: totals.repartoPropio },
      { name: 'Reparto a Transporte', count: totals.repartoTransporte },
      { name: 'Retira Cliente', count: totals.retiraCliente },
      { name: 'Retira Comisionista', count: totals.retiraComisionista },
    ].sort((a, b) => b.count - a.count);
    return { chartData, listData };
  }, [stats]);

  const retiraCount =
    stats?.primaryData?.deliveryTypeTotals?.find(
      (item) => item._id === 'Retira'
    )?.count || 0;
  const repartoCount =
    stats?.primaryData?.deliveryTypeTotals?.find(
      (item) => item._id === 'Reparto'
    )?.count || 0;

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
              <button
                onClick={() => setDateRange('today')}
                className={activeFilter === 'today' ? 'active' : ''}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange('yesterday')}
                className={activeFilter === 'yesterday' ? 'active' : ''}
              >
                Ayer
              </button>
              <button
                onClick={() => setDateRange('this_month')}
                className={activeFilter === 'this_month' ? 'active' : ''}
              >
                Este Mes
              </button>
              <button
                onClick={() => setDateRange('last_month')}
                className={activeFilter === 'last_month' ? 'active' : ''}
              >
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
            <div className="stats-grid six-columns">
              <div className="stat-card">
                <h4>Total Pedidos</h4>
                <p>{stats.primaryData.summary.totalOrders}</p>
                {isComparisonEnabled && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        stats.primaryData.summary.totalOrders,
                        stats.comparisonData?.summary.totalOrders
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        stats.primaryData.summary.totalOrders,
                        stats.comparisonData?.summary.totalOrders
                      ).value
                    }
                  </span>
                )}
              </div>
              <div className="stat-card">
                <h4>Prom. Diario</h4>
                <p>{stats.primaryData.summary.dailyAverage}</p>
                {isComparisonEnabled && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        stats.primaryData.summary.dailyAverage,
                        stats.comparisonData?.summary.dailyAverage
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        stats.primaryData.summary.dailyAverage,
                        stats.comparisonData?.summary.dailyAverage
                      ).value
                    }
                  </span>
                )}
              </div>
              <div className="stat-card">
                <h4>Total Bultos</h4>
                <p>{stats.primaryData.summary.totalPackages}</p>
                {isComparisonEnabled && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        stats.primaryData.summary.totalPackages,
                        stats.comparisonData?.summary.totalPackages
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        stats.primaryData.summary.totalPackages,
                        stats.comparisonData?.summary.totalPackages
                      ).value
                    }
                  </span>
                )}
              </div>
              <div className="stat-card">
                <h4>Total Pallets</h4>
                <p>{stats.primaryData.summary.totalPallets}</p>
                {isComparisonEnabled && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        stats.primaryData.summary.totalPallets,
                        stats.comparisonData?.summary.totalPallets
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        stats.primaryData.summary.totalPallets,
                        stats.comparisonData?.summary.totalPallets
                      ).value
                    }
                  </span>
                )}
              </div>
              <div className="stat-card">
                <h4>Total Retira</h4>
                <p>{retiraCount}</p>
                {isComparisonEnabled && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        retiraCount,
                        stats.comparisonData?.deliveryTypeTotals?.find(
                          (i) => i._id === 'Retira'
                        )?.count || 0
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        retiraCount,
                        stats.comparisonData?.deliveryTypeTotals?.find(
                          (i) => i._id === 'Retira'
                        )?.count || 0
                      ).value
                    }
                  </span>
                )}
              </div>
              <div className="stat-card">
                <h4>Total Reparto</h4>
                <p>{repartoCount}</p>
                {isComparisonEnabled && (
                  <span
                    className={`diff ${
                      getPercentageDiff(
                        repartoCount,
                        stats.comparisonData?.deliveryTypeTotals?.find(
                          (i) => i._id === 'Reparto'
                        )?.count || 0
                      ).className
                    }`}
                  >
                    {
                      getPercentageDiff(
                        repartoCount,
                        stats.comparisonData?.deliveryTypeTotals?.find(
                          (i) => i._id === 'Reparto'
                        )?.count || 0
                      ).value
                    }
                  </span>
                )}
              </div>
            </div>

            {stats.primaryData.ordersByDay && (
              <div className="full-width-chart-container">
                <LineChart
                  chartData={prepareFullDateRangeChartData(
                    primaryStartDate,
                    primaryEndDate,
                    stats.primaryData.ordersByDay
                  )}
                  title={`Tendencia de Pedidos Diarios (${format(
                    primaryStartDate,
                    'dd/MM'
                  )} - ${format(primaryEndDate, 'dd/MM')})`}
                />
              </div>
            )}

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
                    <StatsList data={stats.primaryData.byPacker} />
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
                      title="Pedidos por Usuario (Cerrador)"
                    />
                  </div>
                  <div className="report-list">
                    <StatsList data={stats.primaryData.byUser} />
                  </div>
                </div>
              )}
              {transportStats.chartData && (
                <div className="report-item-full">
                  <div className="report-chart">
                    <DoughnutChart
                      chartData={transportStats.chartData}
                      title="Distribución por Tipo de Entrega"
                    />
                  </div>
                  <div className="report-list">
                    <div className="stats-list-widget">
                      <h3>Detalle de Entrega</h3>
                      <ul>
                        {transportStats.listData.map((item) => (
                          <li key={item.name}>
                            <span className="item-name">{item.name}</span>
                            <div className="item-details">
                              <span className="item-count">
                                {item.count} pedidos
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
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
                        <th>Detalle</th>
                        <th>Armador</th>
                        <th>Cerrador</th>
                        <th>Bultos</th>
                        <th>Es Pallet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.details.map((order) => {
                        const [tipo, ...detalleParts] = (
                          order.transport || ''
                        ).split(': ');
                        const detalle = detalleParts.join(': ');
                        return (
                          <tr key={order._id}>
                            <td>
                              {format(
                                new Date(order.timestamp),
                                'dd/MM/yyyy HH:mm'
                              )}
                            </td>
                            <td>{order.orderNumber}</td>
                            <td>{tipo}</td>
                            <td>{detalle}</td>
                            <td>{order.packer}</td>
                            <td>{order.closer}</td>
                            <td>{order.packageCount}</td>
                            <td>{order.isPallet ? 'Sí' : 'No'}</td>
                          </tr>
                        );
                      })}
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
