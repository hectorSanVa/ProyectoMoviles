import api from './api';

export const supplierService = {
  // Obtener todos los proveedores
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/suppliers', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      throw error;
    }
  },

  // Obtener proveedor por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo proveedor:', error);
      throw error;
    }
  },

  // Crear nuevo proveedor
  create: async (supplierData) => {
    try {
      const response = await api.post('/suppliers', supplierData);
      return response.data;
    } catch (error) {
      console.error('Error creando proveedor:', error);
      throw error;
    }
  },

  // Actualizar proveedor
  update: async (id, supplierData) => {
    try {
      const response = await api.put(`/suppliers/${id}`, supplierData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      throw error;
    }
  },

  // Eliminar proveedor
  delete: async (id) => {
    try {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      throw error;
    }
  },

  // Obtener productos de un proveedor
  getProducts: async (id, params = {}) => {
    try {
      const response = await api.get(`/suppliers/${id}/products`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo productos del proveedor:', error);
      throw error;
    }
  }
};

