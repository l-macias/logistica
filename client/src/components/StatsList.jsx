import React from 'react';
import './StatsList.css';

const StatsList = ({ title, data, total }) => {
  if (!data || data.length === 0) {
    return null; // No mostramos nada si no hay datos
  }

  return (
    <div className="stats-list-widget">
      <h3>{title}</h3>
      <ul>
        {data.map((item) => {
          // Calculamos el porcentaje aquí mismo
          const percentage =
            total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          return (
            <li key={item._id || item.name}>
              <span className="item-name">{item._id || item.name}</span>
              <div className="item-details">
                <span className="item-percentage">{percentage}%</span>
                <span className="item-count">{item.count} pedidos</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default StatsList;
