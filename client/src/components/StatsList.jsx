import React from 'react';
import './StatsList.css';

const StatsList = ({ title, data }) => {
  // Ya no necesitamos 'total'
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="stats-list-widget">
      <h3>{title}</h3>
      <ul>
        {data.map((item) => (
          <li key={item._id || item.name}>
            <span className="item-name">{item._id || item.name}</span>
            <div className="item-details">
              {/* Mostramos los nuevos datos */}
              <span className="detail-item">
                Bultos: <strong>{item.totalPackages || 0}</strong>
              </span>
              <span className="detail-item">
                Pallets: <strong>{item.totalPallets || 0}</strong>
              </span>
              <span className="item-count">{item.count} pedidos</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StatsList;
