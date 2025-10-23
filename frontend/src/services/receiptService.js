import AsyncStorage from '@react-native-async-storage/async-storage';

export const receiptService = {
  // Generar comprobante (simulado para Expo Go)
  generateReceipt: async (saleData) => {
    try {
      // Validar datos y asegurar que todos los campos numéricos sean números
      const safeData = {
        sale_number: saleData.sale_number || 'N/A',
        created_at: saleData.created_at || new Date().toISOString(),
        customer_name: saleData.customer_name || 'Cliente general',
        subtotal: Number(saleData.subtotal) || 0,
        tax_amount: Number(saleData.tax_amount) || 0,
        total: Number(saleData.total) || 0,
        payment_method: saleData.payment_method || 'efectivo',
        cash_received: Number(saleData.cash_received) || 0,
        change: Number(saleData.change) || 0,
        items: saleData.items || []
      };

      // Simular generación de comprobante
      const receiptText = `
═══════════════════════════════════════
           TIENDA DE ABARROTES
═══════════════════════════════════════
        Comprobante de Venta

Venta #: ${safeData.sale_number}
Fecha: ${new Date(safeData.created_at).toLocaleString('es-MX')}
Cliente: ${safeData.customer_name}

───────────────────────────────────────
PRODUCTOS:
───────────────────────────────────────
${safeData.items.map(item => 
  `${item.product_name || 'Producto'}
  ${item.quantity || 0} x $${(item.unit_price || 0).toFixed(2)} = $${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}`
).join('\n\n')}

───────────────────────────────────────
Subtotal: $${safeData.subtotal.toFixed(2)}
IVA (16%): $${safeData.tax_amount.toFixed(2)}
───────────────────────────────────────
TOTAL: $${safeData.total.toFixed(2)}

Forma de pago: ${safeData.payment_method.toUpperCase()}
${safeData.payment_method === 'efectivo' && safeData.cash_received > 0 ? 
  `Efectivo recibido: $${safeData.cash_received.toFixed(2)}
Cambio: $${safeData.change.toFixed(2)}` : ''}

═══════════════════════════════════════
        ¡Gracias por su compra!
           Vuelva pronto
═══════════════════════════════════════
      `;

      // Guardar comprobante en AsyncStorage
      const receiptId = `receipt_${safeData.sale_number}_${Date.now()}`;
      const receiptData = {
        id: receiptId,
        sale_number: safeData.sale_number,
        created_at: safeData.created_at,
        total: safeData.total,
        receiptText: receiptText,
        timestamp: Date.now()
      };

      // Obtener comprobantes existentes
      const existingReceipts = await AsyncStorage.getItem('receipts');
      const receipts = existingReceipts ? JSON.parse(existingReceipts) : [];
      
      // Agregar nuevo comprobante
      receipts.push(receiptData);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('receipts', JSON.stringify(receipts));
      
      return {
        success: true,
        receiptId: receiptId,
        fileName: `venta_${safeData.sale_number}_${Date.now()}.txt`,
        receiptText: receiptText
      };

    } catch (error) {
      console.error('Error generando comprobante:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Obtener todos los comprobantes guardados
  getAllReceipts: async () => {
    try {
      const receipts = await AsyncStorage.getItem('receipts');
      return receipts ? JSON.parse(receipts) : [];
    } catch (error) {
      console.error('Error obteniendo comprobantes:', error);
      return [];
    }
  },

  // Obtener comprobante por ID
  getReceiptById: async (receiptId) => {
    try {
      const receipts = await receiptService.getAllReceipts();
      return receipts.find(receipt => receipt.id === receiptId);
    } catch (error) {
      console.error('Error obteniendo comprobante:', error);
      return null;
    }
  },

  // Eliminar comprobante
  deleteReceipt: async (receiptId) => {
    try {
      const receipts = await receiptService.getAllReceipts();
      const filteredReceipts = receipts.filter(receipt => receipt.id !== receiptId);
      await AsyncStorage.setItem('receipts', JSON.stringify(filteredReceipts));
      return { success: true };
    } catch (error) {
      console.error('Error eliminando comprobante:', error);
      return { success: false, error: error.message };
    }
  },

  // Limpiar todos los comprobantes
  clearAllReceipts: async () => {
    try {
      await AsyncStorage.removeItem('receipts');
      return { success: true };
    } catch (error) {
      console.error('Error limpiando comprobantes:', error);
      return { success: false, error: error.message };
    }
  },

  // Mostrar comprobante
  showReceipt: async (receiptData) => {
    try {
      console.log('Comprobante generado:', receiptData.receiptText);
      return { success: true, receiptText: receiptData.receiptText };
    } catch (error) {
      console.error('Error mostrando comprobante:', error);
      return { success: false, error: error.message };
    }
  }
};
