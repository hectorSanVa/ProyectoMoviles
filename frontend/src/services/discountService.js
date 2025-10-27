import api from './api';

export const discountService = {
  // Obtener todos los descuentos
  getAll: async () => {
    try {
      const response = await api.get('/discounts');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener solo descuentos activos
  getActive: async () => {
    try {
      const response = await api.get('/discounts/active');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener un descuento por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/discounts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear un descuento
  create: async (data) => {
    try {
      const response = await api.post('/discounts', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar un descuento
  update: async (id, data) => {
    try {
      const response = await api.put(`/discounts/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Eliminar un descuento
  delete: async (id) => {
    try {
      const response = await api.delete(`/discounts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }
};

