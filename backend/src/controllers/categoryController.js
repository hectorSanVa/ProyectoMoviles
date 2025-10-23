const { query, getClient } = require('../config/database');

const categoryController = {
  // Obtener todas las categorías
  getAll: async (req, res) => {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      
      let whereClause = '';
      let params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereClause = `WHERE name ILIKE $${paramCount} OR description ILIKE $${paramCount}`;
        params.push(`%${search}%`);
      }

      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const result = await query(`
        SELECT 
          id, name, description
        FROM categories 
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `, params);

      // Contar total para paginación
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM categories 
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
      console.error('Error obteniendo categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener categoría por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await query(`
        SELECT 
          id, name, description
        FROM categories 
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nueva categoría
  create: async (req, res) => {
    try {
      const { name, description } = req.body;

      // Validaciones
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es obligatorio'
        });
      }

      // Verificar si ya existe una categoría con el mismo nombre
      const existingCategory = await query(
        'SELECT id FROM categories WHERE name = $1',
        [name.trim()]
      );

      if (existingCategory.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }

      const result = await query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description
      `, [name.trim(), description?.trim() || null]);

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar categoría
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validaciones
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la categoría es obligatorio'
        });
      }

      // Verificar si la categoría existe
      const existingCategory = await query(
        'SELECT id FROM categories WHERE id = $1',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar si ya existe otra categoría con el mismo nombre
      const duplicateCategory = await query(
        'SELECT id FROM categories WHERE name = $1 AND id != $2',
        [name.trim(), id]
      );

      if (duplicateCategory.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con ese nombre'
        });
      }

      const result = await query(`
        UPDATE categories 
        SET name = $1, description = $2
        WHERE id = $3
        RETURNING id, name, description
      `, [name.trim(), description?.trim() || null, id]);

      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar categoría
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si la categoría existe
      const existingCategory = await query(
        'SELECT id FROM categories WHERE id = $1',
        [id]
      );

      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar si tiene productos asociados
      const productsWithCategory = await query(
        'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
        [id]
      );

      if (parseInt(productsWithCategory.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la categoría porque tiene productos asociados'
        });
      }

      await query(
        'DELETE FROM categories WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener productos de una categoría
  getProducts: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const result = await query(`
        SELECT 
          p.id, p.name, p.code, p.sale_price, p.stock, p.min_stock,
          p.image_url, p.created_at, p.updated_at
        FROM products p
        WHERE p.category_id = $1 AND p.is_active = true
        ORDER BY p.name ASC
        LIMIT $2 OFFSET $3
      `, [id, limit, offset]);

      // Contar total de productos
      const countResult = await query(
        'SELECT COUNT(*) as total FROM products WHERE category_id = $1 AND is_active = true',
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
      console.error('Error obteniendo productos de la categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = categoryController;

