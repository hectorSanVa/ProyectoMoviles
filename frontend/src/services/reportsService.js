import api from './api';

export const reportsService = {
  // Obtener ventas del día
  getDailySales: async (date) => {
    try {
      const response = await api.get('/reports/daily', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ventas diarias:', error);
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener top productos
  getTopProducts: async (limit = 10, days = 7) => {
    try {
      const response = await api.get('/reports/top-products', {
        params: { limit, days }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo top productos:', error);
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener productos con stock bajo
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/reports/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo stock bajo:', error);
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener resumen general
  getSummary: async () => {
    try {
      const response = await api.get('/reports/summary');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }
};

