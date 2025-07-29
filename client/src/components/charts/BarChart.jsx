import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ chartData, title }) => {
  const options = {
    responsive: true,
    // 👇 AÑADIMOS ESTA LÍNEA
    maintainAspectRatio: false, // <-- Esto es clave
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        color: '#0A2D4D',
        font: { size: 16 },
      },
    },
  };

  return <Bar options={options} data={chartData} />;
};

export default BarChart;
