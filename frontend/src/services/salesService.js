import api from './api';

export const salesService = {
  // Obtener todas las ventas
  getAll: async () => {
    try {
      const response = await api.get('/sales');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      throw error;
    }
  },

  // Obtener venta por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo venta:', error);
      throw error;
    }
  },

  // Crear nueva venta
  create: async (saleData) => {
    try {
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      console.error('Error creando venta:', error);
      throw error;
    }
  },

  // Obtener ventas por fecha
  getByDate: async (date) => {
    try {
      const response = await api.get(`/sales/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ventas por fecha:', error);
      throw error;
    }
  },

  // Obtener ventas por cliente
  getByCustomer: async (customerName) => {
    try {
      const response = await api.get(`/sales/customer/${encodeURIComponent(customerName)}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ventas por cliente:', error);
      throw error;
    }
  },
};