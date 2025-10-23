import api from './api';

export const categoryService = {
  // Obtener todas las categorías
  getAll: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  },

  // Obtener categoría por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      throw error;
    }
  },

  // Crear nueva categoría
  create: async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  },

  // Actualizar categoría
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      throw error;
    }
  },

  // Eliminar categoría
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      throw error;
    }
  }
};

