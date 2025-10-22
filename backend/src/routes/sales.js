const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Aplicar middleware a todas las rutas
router.use(verifyToken);

// GET /api/sales - Obtener ventas
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, page = 1, limit = 20 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      whereClause += ` AND s.created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND s.created_at <= $${paramCount}`;
      params.push(end_date);
    }

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const result = await query(`
      SELECT 
        s.id, s.sale_number, s.subtotal, s.tax_amount, s.total,
        s.payment_method, s.payment_status, s.created_at,
        u.username as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM sales s
      ${whereClause}
    `, params.slice(0, -2));

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/sales/:id - Obtener venta por ID con detalles
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información de la venta
    const saleResult = await query(`
      SELECT 
        s.id, s.sale_number, s.subtotal, s.tax_amount, s.total,
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
});

// POST /api/sales - Crear nueva venta
router.post('/', async (req, res) => {
  const client = await require('../config/database').pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      items, // Array de {product_id, quantity, unit_price}
      payment_method = 'cash',
      subtotal,
      tax_amount = 0,
      total
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La venta debe tener al menos un producto'
      });
    }

    // Crear la venta
    const saleResult = await client.query(`
      INSERT INTO sales (
        user_id, subtotal, tax_amount, total, payment_method, payment_status
      ) VALUES ($1, $2, $3, $4, $5, 'completed')
      RETURNING id, sale_number, subtotal, tax_amount, total
    `, [
      req.user.id,
      subtotal,
      tax_amount,
      total,
      payment_method
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
        item.unit_price,
        item.quantity * item.unit_price
      ]);

      // Obtener stock actual
      const stockResult = await client.query(
        'SELECT stock FROM products WHERE id = $1',
        [item.product_id]
      );

      if (stockResult.rows.length === 0) {
        throw new Error(`Producto con ID ${item.product_id} no encontrado`);
      }

      const currentStock = stockResult.rows[0].stock;
      const newStock = currentStock - item.quantity;

      if (newStock < 0) {
        throw new Error(`Stock insuficiente para el producto ID ${item.product_id}`);
      }

      // Actualizar stock del producto
      await client.query(
        'UPDATE products SET stock = $1 WHERE id = $2',
        [newStock, item.product_id]
      );

      // Registrar movimiento de stock
      await client.query(`
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, previous_stock, new_stock, reference_id
        ) VALUES ($1, 'sale', $2, $3, $4, $5)
      `, [
        item.product_id,
        -item.quantity, // Cantidad negativa para venta
        currentStock,
        newStock,
        sale.id
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: {
        sale_id: sale.id,
        sale_number: sale.sale_number,
        total: sale.total
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
});

// GET /api/sales/reports/daily - Reporte de ventas del día
router.get('/reports/daily', async (req, res) => {
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
});

module.exports = router;

