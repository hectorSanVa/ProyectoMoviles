import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTS_CACHE_KEY = 'products_cache';
const LAST_SYNC_KEY = 'last_sync';

export const offlineStorageService = {
  /**
   * Guardar productos en caché local
   */
  cacheProducts: async (products) => {
    try {
      await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      console.log('💾 Productos guardados en caché local');
    } catch (error) {
      console.error('❌ Error guardando productos en caché:', error);
    }
  },

  /**
   * Obtener productos del caché local
   */
  getCachedProducts: async () => {
    try {
      const data = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error obteniendo productos del caché:', error);
      return [];
    }
  },

  /**
   * Verificar si hay productos en caché
   */
  hasCachedProducts: async () => {
    const products = await offlineStorageService.getCachedProducts();
    return products.length > 0;
  },

  /**
   * Obtener fecha de última sincronización
   */
  getLastSyncDate: async () => {
    try {
      const date = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return date ? new Date(date) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Limpiar caché de productos
   */
  clearCache: async () => {
    try {
      await AsyncStorage.removeItem(PRODUCTS_CACHE_KEY);
      await AsyncStorage.removeItem(LAST_SYNC_KEY);
      console.log('🗑️ Caché de productos limpiado');
    } catch (error) {
      console.error('❌ Error limpiando caché:', error);
    }
  }
};


