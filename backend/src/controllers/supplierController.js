const { query, getClient } = require('../config/database');

const supplierController = {
  // Obtener todos los proveedores
  getAll: async (req, res) => {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      
      let whereClause = 'WHERE is_active = true';
      let params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const result = await query(`
        SELECT 
          id, name, contact_person, phone, email, address, 
          created_at, updated_at
        FROM suppliers 
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `, params);

      // Contar total para paginación
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM suppliers 
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
      console.error('Error obteniendo proveedores:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener proveedor por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await query(`
        SELECT 
          id, name, contact_person, phone, email, address, 
          created_at, updated_at
        FROM suppliers 
        WHERE id = $1 AND is_active = true
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo proveedor
  create: async (req, res) => {
    try {
      const { name, contact_person, phone, email, address } = req.body;

      // Validaciones
      if (!name || !contact_person) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y persona de contacto son obligatorios'
        });
      }

      // Verificar si ya existe un proveedor con el mismo nombre
      const existingSupplier = await query(
        'SELECT id FROM suppliers WHERE name = $1 AND is_active = true',
        [name]
      );

      if (existingSupplier.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con ese nombre'
        });
      }

      const result = await query(`
        INSERT INTO suppliers (name, contact_person, phone, email, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, contact_person, phone, email, address, created_at
      `, [name, contact_person, phone || null, email || null, address || null]);

      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creando proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar proveedor
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, contact_person, phone, email, address } = req.body;

      // Validaciones
      if (!name || !contact_person) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y persona de contacto son obligatorios'
        });
      }

      // Verificar si el proveedor existe
      const existingSupplier = await query(
        'SELECT id FROM suppliers WHERE id = $1 AND is_active = true',
        [id]
      );

      if (existingSupplier.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      // Verificar si ya existe otro proveedor con el mismo nombre
      const duplicateSupplier = await query(
        'SELECT id FROM suppliers WHERE name = $1 AND id != $2 AND is_active = true',
        [name, id]
      );

      if (duplicateSupplier.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro proveedor con ese nombre'
        });
      }

      const result = await query(`
        UPDATE suppliers 
        SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5, updated_at = NOW()
        WHERE id = $6 AND is_active = true
        RETURNING id, name, contact_person, phone, email, address, updated_at
      `, [name, contact_person, phone || null, email || null, address || null, id]);

      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar proveedor (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si el proveedor existe
      const existingSupplier = await query(
        'SELECT id FROM suppliers WHERE id = $1 AND is_active = true',
        [id]
      );

      if (existingSupplier.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      // Verificar si tiene productos asociados
      const productsWithSupplier = await query(
        'SELECT COUNT(*) as count FROM products WHERE supplier_id = $1 AND is_active = true',
        [id]
      );

      if (parseInt(productsWithSupplier.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el proveedor porque tiene productos asociados'
        });
      }

      await query(
        'UPDATE suppliers SET is_active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener productos de un proveedor
  getProducts: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const result = await query(`
        SELECT 
          p.id, p.name, p.code, p.sale_price, p.stock, p.min_stock,
          p.created_at, p.updated_at
        FROM products p
        WHERE p.supplier_id = $1 AND p.is_active = true
        ORDER BY p.name ASC
        LIMIT $2 OFFSET $3
      `, [id, limit, offset]);

      // Contar total de productos
      const countResult = await query(
        'SELECT COUNT(*) as total FROM products WHERE supplier_id = $1 AND is_active = true',
        [id]
      );

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
      console.error('Error obteniendo productos del proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = supplierController;

