import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { salesService } from './salesService';
import { receiptService } from './receiptService';

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
          // Extraer los datos de la venta (compatibilidad con formato viejo y nuevo)
          const saleDataToSync = sale.saleData || sale;
          const receiptData = sale.receiptData;
          
          // Intentar sincronizar la venta
          const result = await salesService.create(saleDataToSync);
          
          // Si la venta se sincronizó exitosamente y hay receiptData, generar comprobante
          if (result.success && receiptData) {
            try {
              console.log('🧾 Generando comprobante para venta sincronizada...');
              console.log(`📝 Número de venta REAL del servidor: ${result.data.sale_number}`);
              
              // Eliminar el comprobante OFFLINE anterior si existe (buscar por sale_number que empiece con OFFLINE-)
              try {
                const allReceipts = await receiptService.getAllReceipts();
                const offlineReceipts = allReceipts.filter(r => 
                  r.sale_number && r.sale_number.startsWith('OFFLINE-')
                );
                
                // Si hay un comprobante OFFLINE con items similares, eliminarlo
                const receiptToDelete = offlineReceipts.find(r => 
                  r.total === receiptData.total && 
                  r.customer_name === receiptData.customer_name &&
                  r.timestamp && (Date.now() - r.timestamp < 86400000) // Últimas 24 horas
                );
                
                if (receiptToDelete) {
                  console.log('🗑️ Eliminando comprobante OFFLINE temporal...');
                  await receiptService.deleteReceipt(receiptToDelete.id);
                }
              } catch (deleteError) {
                console.warn('⚠️ No se pudo eliminar comprobante OFFLINE:', deleteError);
              }
              
              // Generar nuevo comprobante con número REAL
              const receiptResult = await receiptService.generateReceipt({
                ...receiptData,
                sale_number: result.data.sale_number,
                id: result.data.id,
                user_id: result.data.user_id
              });
              
              console.log(`✅ Comprobante generado con número REAL: ${result.data.sale_number}`);
              console.log(`📄 Nombre del archivo: ${receiptResult?.fileName}`);
            } catch (receiptError) {
              console.warn('⚠️ No se pudo generar comprobante para venta sincronizada:', receiptError);
              // No fallar la sincronización por esto
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
   * Estrategia: Siempre asumir online, pero guardar offline si falla
   */
  isOnline: async () => {
    try {
      // Intentar petición al backend con timeout razonable
      const response = await api.get('/api/health', { timeout: 10000 });
      return response.status === 200 || response.statusText === 'OK';
    } catch (error) {
      // Si falla, asumir que hay internet pero el backend está durmiendo
      // Esto evita mostrar "offline" erróneamente cuando Render tarda en despertar
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

