const { query, getClient } = require('../config/database');

const salesController = {
  // Obtener todas las ventas
  getAll: async (req, res) => {
    try {
      const { user_id } = req.query;

      let whereClause = '';
      const params = [];

      // Si es cajero, solo puede ver sus propias ventas
      if (req.user.role === 'cajero') {
        params.push(req.user.id);
        whereClause = 'WHERE s.user_id = $1';
      }
      // Si es admin y hay filtro de usuario, puede filtrar
      else if (user_id && req.user.role === 'admin') {
        params.push(user_id);
        whereClause = 'WHERE s.user_id = $1';
      }

      const result = await query(`
        SELECT 
          s.id, s.sale_number, s.subtotal, s.tax_amount, s.total,
          s.payment_method, s.payment_status, s.created_at,
          s.customer_name, s.user_id,
          u.username as cashier_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT 100
      `, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: 1,
          limit: 100,
          total: result.rows.length,
          pages: 1
        }
      });

    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener ventas por usuario (para admin)
  getByUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await query(`
        SELECT 
          s.id, s.sale_number, s.subtotal, s.tax_amount, s.total,
          s.payment_method, s.payment_status, s.created_at,
          s.customer_name,
          u.username as cashier_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT 100
      `, [userId]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo ventas por usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener resumen de ventas por usuario (para admin)
  getSalesSummaryByUser: async (req, res) => {
    try {
      const result = await query(`
        SELECT 
          u.id as user_id,
          u.username,
          u.email,
          COUNT(s.id) as total_sales,
          COALESCE(SUM(s.total), 0) as total_revenue,
          COALESCE(AVG(s.total), 0) as average_sale,
          COALESCE(MIN(s.created_at), NULL) as first_sale,
          COALESCE(MAX(s.created_at), NULL) as last_sale
        FROM users u
        LEFT JOIN sales s ON u.id = s.user_id AND s.payment_status = 'completed'
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'cajero')
        GROUP BY u.id, u.username, u.email
        ORDER BY total_revenue DESC
      `);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo resumen de ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener venta por ID con detalles
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Obtener información de la venta
      const saleResult = await query(`
        SELECT 
          s.id, s.sale_number, s.customer_name, s.subtotal, s.tax_amount, s.total,
          s.payment_method, s.payment_status, s.created_at,
          u.username as cashier_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
      `, [id]);

      if (saleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }

      // Obtener detalles de la venta
      const itemsResult = await query(`
        SELECT 
          si.id, si.quantity, si.unit_price, si.subtotal,
          p.name as product_name, p.code as product_code
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = $1
        ORDER BY si.id
      `, [id]);

      res.json({
        success: true,
        data: {
          sale: saleResult.rows[0],
          items: itemsResult.rows
        }
      });

    } catch (error) {
      console.error('Error obteniendo venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nueva venta
  create: async (req, res) => {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      const {
        items, // Array de {product_id, quantity, price}
        payment_method,
        customer_name = 'Cliente general'
      } = req.body;

      console.log('🔍 Body completo:', req.body);
      console.log('🔍 Payment method recibido:', payment_method);
      console.log('🔍 User ID del JWT:', req.user.id);
      console.log('🔍 User completo:', req.user);
      
      // Verificar que user.id existe
      if (!req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario no válido en el token'
        });
      }
      
      // Normalizar payment_method - SIEMPRE usar 'efectivo' por defecto
      const normalizedPaymentMethod = payment_method && payment_method.trim() !== '' ? payment_method.trim() : 'efectivo';
      
      console.log('🔍 Payment method normalizado:', normalizedPaymentMethod);

      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La venta debe tener al menos un producto'
        });
      }

          // Calcular totales
          const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
          const taxRate = 0.16; // 16% IVA México
          const taxAmount = subtotal * taxRate;
          const total = subtotal + taxAmount;

      // Generar número de venta
      const saleNumber = `V${Date.now()}`;

          // Crear la venta - SIEMPRE usar 'cash' (que es aceptado por el CHECK)
          const saleResult = await client.query(`
            INSERT INTO sales (
              user_id, sale_number, customer_name, subtotal, tax_amount, total, payment_method, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'cash', 'completed')
            RETURNING id, sale_number, subtotal, tax_amount, total
          `, [
            req.user.id,
            saleNumber,
            customer_name,
            subtotal,
            taxAmount,
            total
          ]);

      const sale = saleResult.rows[0];

      // Crear los items de la venta y actualizar stock
      for (const item of items) {
        // Insertar item de venta
        await client.query(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          sale.id,
          item.product_id,
          item.quantity,
          item.price,
          item.quantity * item.price
        ]);

        // Obtener información del producto
        const productResult = await client.query(
          'SELECT stock, stock_in_units, sale_type FROM products WHERE id = $1',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Producto con ID ${item.product_id} no encontrado`);
        }

        const product = productResult.rows[0];
        const isBulkProduct = product.sale_type === 'weight';

        if (isBulkProduct) {
          // Producto a granel - actualizar stock_in_units
          const currentStockInUnits = parseFloat(product.stock_in_units || 0);
          const newStockInUnits = currentStockInUnits - item.quantity;

          console.log('🔍 Producto a granel - Actualizando stock:');
          console.log('  - Producto ID:', item.product_id);
          console.log('  - Stock actual:', currentStockInUnits);
          console.log('  - Cantidad vendida:', item.quantity);
          console.log('  - Stock nuevo:', newStockInUnits);

          if (newStockInUnits < 0) {
            throw new Error(`Stock insuficiente para el producto ID ${item.product_id}. Disponible: ${currentStockInUnits}`);
          }

          // Actualizar stock_in_units del producto
          await client.query(
            'UPDATE products SET stock_in_units = $1 WHERE id = $2',
            [newStockInUnits, item.product_id]
          );

          console.log('✅ Stock actualizado para producto a granel:', item.product_id);

          // Registrar movimiento de stock para producto a granel
          await client.query(`
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, previous_stock, new_stock, reference_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            item.product_id,
            'sale', // Tipo de movimiento
            -item.quantity, // Cantidad negativa para venta
            currentStockInUnits, // Stock anterior
            newStockInUnits, // Stock nuevo
            sale.id, // ID de la venta
            `Venta #${sale.sale_number} (${item.quantity}${item.unit_of_measure || 'kg'})`
          ]);
        } else {
          // Producto por unidad - lógica original
          const currentStock = product.stock;
          const newStock = currentStock - item.quantity;

          if (newStock < 0) {
            throw new Error(`Stock insuficiente para el producto ID ${item.product_id}. Disponible: ${currentStock}`);
          }

          // Actualizar stock del producto
          await client.query(
            'UPDATE products SET stock = $1 WHERE id = $2',
            [newStock, item.product_id]
          );

          // Registrar movimiento de stock para producto por unidad
          await client.query(`
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, previous_stock, new_stock, reference_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            item.product_id,
            'sale', // Tipo de movimiento
            -item.quantity, // Cantidad negativa para venta
            currentStock, // Stock anterior
            newStock, // Stock nuevo
            sale.id, // ID de la venta
            `Venta #${sale.sale_number}`
          ]);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Venta registrada exitosamente',
        data: {
          id: sale.id,
          sale_number: sale.sale_number,
          customer_name: customer_name,
          subtotal: sale.subtotal,
          tax_amount: sale.tax_amount,
          total: sale.total,
          payment_method: payment_method,
          created_at: new Date().toISOString()
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creando venta:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    } finally {
      client.release();
    }
  },

  // Obtener reporte diario
  getDailyReport: async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Ventas del día
      const salesResult = await query(`
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total), 0) as total_amount,
          COALESCE(SUM(tax_amount), 0) as total_tax
        FROM sales 
        WHERE DATE(created_at) = $1
      `, [targetDate]);

      // Top productos del día
      const topProductsResult = await query(`
        SELECT 
          p.name as product_name,
          p.code as product_code,
          SUM(si.quantity) as total_quantity,
          SUM(si.subtotal) as total_sales
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.created_at) = $1
        GROUP BY p.id, p.name, p.code
        ORDER BY total_quantity DESC
        LIMIT 10
      `, [targetDate]);

      res.json({
        success: true,
        data: {
          date: targetDate,
          summary: salesResult.rows[0],
          top_products: topProductsResult.rows
        }
      });

    } catch (error) {
      console.error('Error obteniendo reporte diario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = salesController;
