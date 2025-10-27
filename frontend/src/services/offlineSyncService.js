import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { salesService } from './salesService';
import { receiptService } from './receiptService';

const PENDING_SALES_KEY = 'pending_sales';
const SYNC_LOCK_KEY = 'sync_lock';

export const offlineSyncService = {
  /**
   * Liberar lock de sincronización (para debugging o forzar sincronización)
   */
  clearSyncLock: async () => {
    try {
      await AsyncStorage.removeItem(SYNC_LOCK_KEY);
      console.log('✅ Lock de sincronización liberado manualmente');
    } catch (error) {
      console.error('❌ Error liberando lock:', error);
    }
  },

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
    const lockData = await AsyncStorage.getItem(SYNC_LOCK_KEY);
    if (lockData) {
      try {
        const lock = JSON.parse(lockData);
        // Si el lock tiene más de 30 segundos, liberarlo (probablemente quedó bloqueado)
        if (lock.timestamp && (Date.now() - lock.timestamp > 30000)) {
          console.log('⚠️ Liberando lock antiguo...');
          await AsyncStorage.removeItem(SYNC_LOCK_KEY);
        } else {
          console.log('⚠️ Sincronización ya en progreso, omitiendo...');
          return { synced: 0, failed: 0 };
        }
      } catch (e) {
        // Si no se puede parsear, eliminar el lock
        console.log('⚠️ Liberando lock inválido...');
        await AsyncStorage.removeItem(SYNC_LOCK_KEY);
      }
    }

    try {
      // Guardar lock con timestamp
      await AsyncStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({ timestamp: Date.now() }));
      
      const pendingSales = await offlineSyncService.getPendingSales();
      const unsyncedSales = pendingSales.filter(sale => !sale.synced);
      
      if (unsyncedSales.length === 0) {
        console.log('📭 No hay ventas pendientes de sincronizar');
        await AsyncStorage.removeItem(SYNC_LOCK_KEY);
        return { synced: 0, failed: 0 };
      }

      console.log(`🔄 Sincronizando ${unsyncedSales.length} venta(s) pendiente(s)...`);

      let synced = 0;
      let failed = 0;

      for (const sale of unsyncedSales) {
        try {
          // Validar que la venta tenga items válidos
          if (!sale.items || sale.items.length === 0 || !sale.items[0].product_id) {
            console.warn(`⚠️ Venta ${sale.id} tiene formato inválido, eliminando...`);
            await offlineSyncService.markSaleAsSynced(sale.id); // Eliminar
            failed++;
            continue;
          }
          
          // Intentar sincronizar la venta
          const result = await salesService.create(sale);
          
          // Si la venta se sincronizó exitosamente, generar comprobante con número real
          if (result.success && result.data && sale.receiptItems) {
            try {
              console.log('🧾 Generando comprobante con número real del servidor...');
              
              // Eliminar comprobante OFFLINE si existe (buscarlo por total y cliente)
              try {
                const allReceipts = await receiptService.getAllReceipts();
                const offlineReceipt = allReceipts.find(r => {
                  const matchesTotal = Math.abs(Number(r.total) - Number(sale.total)) < 0.01;
                  const matchesCustomer = r.customer_name === (sale.customer_name || 'Cliente general');
                  const isRecent = !r.timestamp || (Date.now() - r.timestamp < 300000); // 5 min
                  return r.sale_number && r.sale_number.startsWith('OFFLINE-') && matchesTotal && matchesCustomer && isRecent;
                });
                
                if (offlineReceipt) {
                  await receiptService.deleteReceipt(offlineReceipt.id);
                  console.log(`🗑️ Comprobante OFFLINE eliminado: ${offlineReceipt.sale_number}`);
                }
              } catch (deleteError) {
                console.warn('⚠️ No se pudo eliminar comprobante OFFLINE:', deleteError);
              }
              
              // Generar nuevo comprobante con número real del servidor
              const receiptData = {
                ...result.data,
                items: sale.receiptItems
              };
              
              await receiptService.generateReceipt(receiptData);
              console.log(`✅ Comprobante generado con número real: ${result.data.sale_number}`);
            } catch (receiptError) {
              console.warn('⚠️ No se pudo generar comprobante para venta sincronizada:', receiptError);
            }
          }
          
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
   * Retorna true si hay conexión, false si realmente no hay internet
   */
  isOnline: async () => {
    try {
      // Intentar petición al backend con timeout razonable
      const response = await api.get('/api/health', { timeout: 10000 });
      return response.status === 200 || response.statusText === 'OK';
    } catch (error) {
      // Verificar si es un error de red real (sin conexión)
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.log('📴 Sin conexión a internet');
        return false;
      }
      
      // Si falla por otra razón (timeout, etc), asumir que hay internet pero el backend está durmiendo
      console.log('⚠️ Backend no responde inmediatamente, pero hay internet');
      return true; // Considerar online para que la UI no muestre "sin conexión"
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

