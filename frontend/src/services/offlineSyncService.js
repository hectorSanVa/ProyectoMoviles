import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import * as salesService from './salesService';

const PENDING_SALES_KEY = 'pending_sales';
const SYNC_LOCK_KEY = 'sync_lock';

export const offlineSyncService = {
  /**
   * Guardar una venta pendiente de sincronizar
   */
  savePendingSale: async (saleData) => {
    try {
      console.log('💾 Guardando venta pendiente localmente...');
      const pendingSales = await offlineSyncService.getPendingSales();
      const newSale = {
        ...saleData,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        synced: false
      };
      pendingSales.push(newSale);
      await AsyncStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pendingSales));
      console.log('✅ Venta pendiente guardada:', newSale.id);
      return newSale;
    } catch (error) {
      console.error('❌ Error guardando venta pendiente:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las ventas pendientes de sincronizar
   */
  getPendingSales: async () => {
    try {
      const data = await AsyncStorage.getItem(PENDING_SALES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error obteniendo ventas pendientes:', error);
      return [];
    }
  },

  /**
   * Marcar una venta como sincronizada
   */
  markSaleAsSynced: async (saleId) => {
    try {
      const pendingSales = await offlineSyncService.getPendingSales();
      const updatedSales = pendingSales.filter(sale => sale.id !== saleId);
      await AsyncStorage.setItem(PENDING_SALES_KEY, JSON.stringify(updatedSales));
      console.log('✅ Venta marcada como sincronizada:', saleId);
    } catch (error) {
      console.error('❌ Error marcando venta como sincronizada:', error);
    }
  },

  /**
   * Sincronizar ventas pendientes con el servidor
   */
  syncPendingSales: async (onProgress) => {
    // Evitar sincronización concurrente
    const lock = await AsyncStorage.getItem(SYNC_LOCK_KEY);
    if (lock) {
      console.log('⚠️ Sincronización ya en progreso, omitiendo...');
      return { synced: 0, failed: 0 };
    }

    try {
      await AsyncStorage.setItem(SYNC_LOCK_KEY, 'true');
      
      const pendingSales = await offlineSyncService.getPendingSales();
      const unsyncedSales = pendingSales.filter(sale => !sale.synced);
      
      if (unsyncedSales.length === 0) {
        console.log('📭 No hay ventas pendientes de sincronizar');
        return { synced: 0, failed: 0 };
      }

      console.log(`🔄 Sincronizando ${unsyncedSales.length} venta(s) pendiente(s)...`);

      let synced = 0;
      let failed = 0;

      for (const sale of unsyncedSales) {
        try {
          // Intentar sincronizar la venta
          await salesService.create(sale);
          
          // Marcar como sincronizada
          await offlineSyncService.markSaleAsSynced(sale.id);
          synced++;
          
          if (onProgress) {
            onProgress({ synced, total: unsyncedSales.length });
          }
          
          console.log(`✅ Venta sincronizada: ${sale.id}`);
        } catch (error) {
          console.error(`❌ Error sincronizando venta ${sale.id}:`, error);
          failed++;
        }
      }

      console.log(`✅ Sincronización completada: ${synced} exitosas, ${failed} fallidas`);
      return { synced, failed };

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return { synced: 0, failed: 0 };
    } finally {
      await AsyncStorage.removeItem(SYNC_LOCK_KEY);
    }
  },

  /**
   * Verificar si hay conexión a internet
   */
  isOnline: async () => {
    try {
      // Intentar hacer una petición simple al backend
      const response = await api.get('/products?limit=1', { timeout: 3000 });
      return response.status === 200 || response.statusText === 'OK';
    } catch (error) {
      return false;
    }
  },

  /**
   * Limpiar todas las ventas pendientes (para testing o reset)
   */
  clearPendingSales: async () => {
    try {
      await AsyncStorage.removeItem(PENDING_SALES_KEY);
      console.log('🗑️ Ventas pendientes eliminadas');
    } catch (error) {
      console.error('❌ Error eliminando ventas pendientes:', error);
    }
  }
};

