import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración base de la API
// URL del backend desplegado en Railway
const API_BASE_URL = 'https://proyectomoviles-production.up.railway.app/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentar timeout a 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
  // Configuración adicional para mejorar la conectividad
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 300; // Solo aceptar códigos 2xx
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log del error para debugging
    console.log('🔍 Error en API:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      // Token expirado o inválido
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }
    
    // Si es un error de timeout, dar más información
    if (error.code === 'ECONNABORTED') {
      error.message = 'Tiempo de espera agotado. El servidor tardó demasiado en responder.';
    }
    
    // Si es un error de red, intentar retry automático
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.log('🔄 Error de red detectado, intentando reconectar...');
      
      // Esperar un poco antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Intentar una petición simple para verificar conectividad
      try {
        const testResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/health`, { timeout: 5000 });
        console.log('✅ Conexión restaurada');
      } catch (testError) {
        console.log('❌ Conexión aún no disponible');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
