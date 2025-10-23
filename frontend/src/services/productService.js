import api from './api';

export const productService = {
  // Obtener todos los productos
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener producto por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear producto
  create: async (productData) => {
    try {
      console.log('📤 Enviando datos al backend:', productData);
      
      // Crear FormData para enviar archivo
      const formData = new FormData();
      
      // Agregar campos de texto
      formData.append('name', productData.name);
      formData.append('code', productData.code);
      formData.append('description', productData.description || '');
      formData.append('purchase_price', productData.purchase_price.toString());
      formData.append('sale_price', productData.sale_price.toString());
      formData.append('stock', productData.stock.toString());
      formData.append('min_stock', productData.min_stock.toString());
      formData.append('category_id', productData.category_id?.toString() || '');
      formData.append('supplier_id', productData.supplier_id?.toString() || '');
      
      // Agregar campos de productos a granel
      formData.append('sale_type', productData.sale_type || 'unit');
      formData.append('unit_of_measure', productData.unit_of_measure || 'kg');
      formData.append('price_per_unit', productData.price_per_unit?.toString() || '');
      formData.append('stock_in_units', productData.stock_in_units?.toString() || '');
      
      // Agregar imagen si existe
      if (productData.image) {
        formData.append('image', {
          uri: productData.image.uri,
          type: productData.image.mimeType || 'image/jpeg',
          name: productData.image.fileName || 'image.jpg'
        });
      }
      
      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en create:', error);
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar producto (simplificado para Expo Go)
  update: async (id, productData) => {
    try {
      console.log('📤 Actualizando producto:', productData);
      
      // Crear FormData para enviar archivo
      const formData = new FormData();
      
      // Agregar campos de texto
      formData.append('name', productData.name);
      formData.append('code', productData.code);
      formData.append('description', productData.description || '');
      formData.append('purchase_price', productData.purchase_price.toString());
      formData.append('sale_price', productData.sale_price.toString());
      formData.append('stock', productData.stock.toString());
      formData.append('min_stock', productData.min_stock.toString());
      formData.append('category_id', productData.category_id?.toString() || '');
      formData.append('supplier_id', productData.supplier_id?.toString() || '');
      
      // Agregar campos de productos a granel
      formData.append('sale_type', productData.sale_type || 'unit');
      formData.append('unit_of_measure', productData.unit_of_measure || 'kg');
      formData.append('price_per_unit', productData.price_per_unit?.toString() || '');
      formData.append('stock_in_units', productData.stock_in_units?.toString() || '');
      
      // Agregar imagen si existe
      if (productData.image) {
        formData.append('image', {
          uri: productData.image.uri,
          type: productData.image.mimeType || 'image/jpeg',
          name: productData.image.fileName || 'image.jpg'
        });
      }
      
      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en update:', error);
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener producto por código
  getByCode: async (code) => {
    try {
      const response = await api.get(`/products/code/${code}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }
};
