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

// GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { search, category, supplier, page = 1, limit = 20 } = req.query;
    
    let whereClause = 'WHERE p.is_active = true';
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND p.category_id = $${paramCount}`;
      params.push(category);
    }

    if (supplier) {
      paramCount++;
      whereClause += ` AND p.supplier_id = $${paramCount}`;
      params.push(supplier);
    }

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const result = await query(`
      SELECT 
        p.id, p.name, p.code, p.description, p.purchase_price, 
        p.sale_price, p.stock, p.min_stock, p.image_url,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.name
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, params);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products p
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
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        p.id, p.name, p.code, p.description, p.purchase_price, 
        p.sale_price, p.stock, p.min_stock, p.image_url,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/products - Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const {
      name, code, description, purchase_price, sale_price,
      stock, min_stock, category_id, supplier_id, image_url
    } = req.body;

    // Validaciones básicas
    if (!name || !code || !purchase_price || !sale_price) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, código, precio de compra y precio de venta son requeridos'
      });
    }

    // Verificar que el código no exista
    const existingProduct = await query(
      'SELECT id FROM products WHERE code = $1',
      [code]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con este código'
      });
    }

    const result = await query(`
      INSERT INTO products (
        name, code, description, purchase_price, sale_price,
        stock, min_stock, category_id, supplier_id, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, code, sale_price, stock
    `, [
      name, code, description, purchase_price, sale_price,
      stock || 0, min_stock || 5, category_id, supplier_id, image_url
    ]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, code, description, purchase_price, sale_price,
      stock, min_stock, category_id, supplier_id, image_url
    } = req.body;

    // Verificar que el producto existe
    const existingProduct = await query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const result = await query(`
      UPDATE products SET
        name = COALESCE($2, name),
        code = COALESCE($3, code),
        description = COALESCE($4, description),
        purchase_price = COALESCE($5, purchase_price),
        sale_price = COALESCE($6, sale_price),
        stock = COALESCE($7, stock),
        min_stock = COALESCE($8, min_stock),
        category_id = COALESCE($9, category_id),
        supplier_id = COALESCE($10, supplier_id),
        image_url = COALESCE($11, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, code, sale_price, stock
    `, [
      id, name, code, description, purchase_price, sale_price,
      stock, min_stock, category_id, supplier_id, image_url
    ]);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id, name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;

