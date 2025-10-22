import api from './api';

export const salesService = {
  // Obtener todas las ventas
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/sales', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener venta por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear nueva venta
  create: async (saleData) => {
    try {
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener reporte diario
  getDailyReport: async (date) => {
    try {
      const response = await api.get('/sales/reports/daily', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },
};

