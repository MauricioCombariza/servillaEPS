import axios from 'axios';

// La URL base de nuestra API de FastAPI.
const API_BASE_URL = 'http://localhost:8000'; 

// Creamos la instancia de Axios.
// El tipo de apiClient será inferido automáticamente por TypeScript como 'AxiosInstance'.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =================================================================
// ==                      INTERCEPTOR DE PETICIONES              ==
// =================================================================
apiClient.interceptors.request.use(
  (config) => { // TypeScript puede inferir el tipo 'InternalAxiosRequestConfig' aquí
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      // Es más seguro asegurarse de que config.headers existe
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =================================================================
// ==                      INTERCEPTOR DE RESPUESTAS              ==
// =================================================================
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Usamos 'any' para el tipo de error para evitar problemas de tipado con la respuesta de Axios
    const errorResponse = (error as any).response;
    
    if (errorResponse && errorResponse.status === 401) {
      console.error("Error 401: No autorizado. Deslogueando...");
      
      localStorage.removeItem('accessToken');
      
      // Solo redirigimos si no estamos ya en la página de login para evitar bucles
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;