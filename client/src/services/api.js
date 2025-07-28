import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// AÑADIMOS EL INTERCEPTOR
// Esta función se ejecutará ANTES de cada petición que salga desde apiClient
apiClient.interceptors.request.use(
  (config) => {
    // Obtenemos el token de localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Si existe, lo añadimos a las cabeceras de la petición
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
