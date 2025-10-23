const { query } = require('../config/database');

const productController = {
  // Obtener todos los productos
  getAll: async (req, res) => {
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
          p.sale_price, p.stock, p.min_stock, p.image_url, p.sale_type,
          p.unit_of_measure, p.price_per_unit, p.stock_in_units,
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
  },

  // Obtener producto por ID
  getById: async (req, res) => {
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
  },

  // Obtener producto por código
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;

      const result = await query(`
        SELECT 
          p.id, p.name, p.code, p.description, p.purchase_price, 
          p.sale_price, p.stock, p.min_stock, p.image_url,
          c.name as category_name,
          s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.code = $1 AND p.is_active = true
      `, [code]);

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
      console.error('Error obteniendo producto por código:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear producto
  create: async (req, res) => {
    try {
      console.log('🔍 Creando producto - Body:', req.body);
      console.log('🔍 Creando producto - File:', req.file);
      console.log('🔍 Creando producto - Cloudinary URL:', req.cloudinaryUrl);
      console.log('🔍 Sale_type recibido:', req.body.sale_type);
      console.log('🔍 Unit_of_measure recibido:', req.body.unit_of_measure);
      console.log('🔍 Price_per_unit recibido:', req.body.price_per_unit);
      console.log('🔍 Stock_in_units recibido:', req.body.stock_in_units);
      
      const {
        name, code, description, purchase_price, sale_price,
        stock, min_stock, category_id, supplier_id, sale_type,
        unit_of_measure, price_per_unit, stock_in_units
      } = req.body;

      console.log('🔍 Valores que se van a insertar:');
      console.log('  - sale_type:', sale_type || 'unit');
      console.log('  - unit_of_measure:', unit_of_measure || 'kg');
      console.log('  - price_per_unit:', price_per_unit || sale_price);
      console.log('  - stock_in_units:', stock_in_units || stock || 0);

      // Convertir strings vacíos a null para campos opcionales
      const categoryId = category_id && category_id !== '' ? parseInt(category_id) : null;
      const supplierId = supplier_id && supplier_id !== '' ? parseInt(supplier_id) : null;

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

      // Manejar imagen si se subió
      let image_url = null;
      if (req.cloudinaryUrl) {
        image_url = req.cloudinaryUrl;
        console.log('✅ Imagen subida a Cloudinary:', image_url);
      } else {
        console.log('⚠️ No se subió imagen para el producto:', name);
      }

      // Determinar valores correctos según el tipo de producto
      const isBulkProduct = sale_type === 'weight';
      const finalSalePrice = isBulkProduct ? (price_per_unit || 0) : (sale_price || 0);
      const finalPrice = isBulkProduct ? (price_per_unit || 0) : (sale_price || 0);
      const finalStock = isBulkProduct ? (stock_in_units || 0) : (stock || 0);
      const finalStockInUnits = isBulkProduct ? (stock_in_units || 0) : (stock || 0);

      console.log('🔍 Valores finales para insertar:');
      console.log('  - isBulkProduct:', isBulkProduct);
      console.log('  - finalSalePrice:', finalSalePrice);
      console.log('  - finalPrice:', finalPrice);
      console.log('  - finalStock:', finalStock);
      console.log('  - finalStockInUnits:', finalStockInUnits);

      const result = await query(`
        INSERT INTO products (
          name, code, description, purchase_price, sale_price, price,
          stock, min_stock, category_id, supplier_id, image_url, sale_type,
          unit_of_measure, price_per_unit, stock_in_units
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, name, code, sale_price, stock, image_url, sale_type, unit_of_measure, price_per_unit, stock_in_units
      `, [
        name, code, description, purchase_price, finalSalePrice, finalPrice,
        finalStock, min_stock || 5, categoryId, supplierId, image_url, sale_type || 'unit',
        unit_of_measure || 'kg', price_per_unit || 0, finalStockInUnits
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
  },

  // Actualizar producto
  update: async (req, res) => {
    try {
      console.log('🔍 Actualizando producto - ID:', req.params.id);
      console.log('🔍 Actualizando producto - Body:', req.body);
      console.log('🔍 Actualizando producto - File:', req.file);
      console.log('🔍 Actualizando producto - Cloudinary URL:', req.cloudinaryUrl);
      
      const { id } = req.params;
      const {
        name, code, description, purchase_price, sale_price,
        stock, min_stock, category_id, supplier_id, sale_type,
        unit_of_measure, price_per_unit, stock_in_units
      } = req.body;

      // Validaciones básicas
      if (!name || !code || !purchase_price || !sale_price) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, código, precio de compra y precio de venta son requeridos'
        });
      }

      // Verificar que el producto existe
      const existingProduct = await query(
        'SELECT id, image_url FROM products WHERE id = $1 AND is_active = true',
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Convertir strings vacíos a null para campos opcionales
      const categoryId = category_id && category_id !== '' ? parseInt(category_id) : null;
      const supplierId = supplier_id && supplier_id !== '' ? parseInt(supplier_id) : null;

      // Manejar imagen si se subió
      let image_url = existingProduct.rows[0].image_url;
      if (req.cloudinaryUrl) {
        image_url = req.cloudinaryUrl;
        console.log('✅ Imagen actualizada en Cloudinary:', image_url);
      }

      const result = await query(`
        UPDATE products SET
          name = $2,
          code = $3,
          description = $4,
          purchase_price = $5,
          sale_price = $6,
          stock = $7,
          min_stock = $8,
          category_id = $9,
          supplier_id = $10,
          image_url = $11,
          sale_type = $12,
          unit_of_measure = $13,
          price_per_unit = $14,
          stock_in_units = $15,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, code, sale_price, stock, image_url, sale_type, unit_of_measure, price_per_unit, stock_in_units
      `, [
        id, name, code, description, purchase_price, sale_price,
        stock, min_stock, categoryId, supplierId, image_url, sale_type || 'unit',
        unit_of_measure || 'kg', price_per_unit || sale_price, stock_in_units || stock || 0
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
  },

  // Eliminar producto (soft delete)
  delete: async (req, res) => {
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
  }
};

module.exports = productController;
