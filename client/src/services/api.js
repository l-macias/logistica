import axios from 'axios';

// La URL de la API se tomará de una variable de entorno en producción,
// o usará la dirección local por defecto en desarrollo.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para AÑADIR el token a todas las peticiones salientes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para MANEJAR las respuestas del servidor
apiClient.interceptors.response.use(
  // Si la respuesta es exitosa (código 2xx), simplemente la devuelve
  (response) => response,

  // Si la respuesta tiene un error...
  (error) => {
    // Verificamos si el error es porque el token expiró (error 401 No Autorizado)
    if (error.response && error.response.status === 401) {
      console.log('Token expirado o inválido. Cerrando sesión...');

      // Limpiamos los datos de la sesión guardados en el navegador
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirigimos al usuario a la página de login.
      // Usamos window.location.href para forzar una recarga completa de la aplicación,
      // lo que limpia cualquier estado de React que pudiera quedar.
      window.location.href = '/login';
    }

    // Para cualquier otro tipo de error, lo devolvemos para que sea manejado
    // por el componente que hizo la llamada a la API.
    return Promise.reject(error);
  }
);

export default apiClient;
