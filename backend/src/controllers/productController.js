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
      const limitParam = paramCount;
      paramCount++;
      params.push(offset);
      const offsetParam = paramCount;

      const result = await query(`
        SELECT 
          p.id, p.name, p.code, p.description, p.purchase_price, 
          p.sale_price, p.stock, p.min_stock, p.image_url, p.sale_type,
          p.unit_of_measure, p.price_per_unit, p.stock_in_units,
          p.category_id, p.supplier_id,
          c.name as category_name,
          s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY p.name
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `, params);

      // Contar total para paginación
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM products p
        ${whereClause}
      `, params.slice(0, paramCount - 2));

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
          p.sale_type, p.unit_of_measure, p.price_per_unit, p.stock_in_units,
          p.category_id, p.supplier_id,
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

      const product = result.rows[0];

      // Buscar descuentos activos para este producto
      const discountsResult = await query(`
        SELECT * FROM discounts
        WHERE (discount_type = 'global' OR 
                (discount_type = 'category' AND target_id = $1) OR
                (discount_type = 'product' AND target_id = $2))
        AND is_active = true
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
        ORDER BY 
          CASE discount_type
            WHEN 'product' THEN 1
            WHEN 'category' THEN 2
            WHEN 'global' THEN 3
          END
        LIMIT 1
      `, [product.category_id, product.id]);

      if (discountsResult.rows.length > 0) {
        const discount = discountsResult.rows[0];
        const discountPercentage = parseFloat(discount.discount_percentage);
        
        // Calcular precio con descuento
        let originalPrice = 0;
        if (product.sale_type === 'weight') {
          originalPrice = product.price_per_unit || 0;
        } else {
          originalPrice = product.sale_price || 0;
        }

        const discountAmount = (originalPrice * discountPercentage) / 100;
        const finalPrice = originalPrice - discountAmount;

        product.discounted_price = finalPrice;
        product.discount_percentage = discountPercentage;
        product.has_discount = true;
        product.original_price = originalPrice;
        product.discount_type = discount.discount_type;
      }

      res.json({
        success: true,
        data: product
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
        unit_of_measure, price_per_unit, stock_in_units, expiration_date, alert_days_before_expiration
      } = req.body;

      console.log('🔍 Valores que se van a insertar:');
      console.log('  - sale_type:', sale_type || 'unit');
      console.log('  - unit_of_measure:', unit_of_measure || 'kg');
      console.log('  - price_per_unit:', price_per_unit || sale_price);
      console.log('  - stock_in_units:', stock_in_units || stock || 0);
      console.log('  - expiration_date:', expiration_date || null);
      console.log('  - alert_days_before_expiration:', alert_days_before_expiration || 7);

      // Convertir strings vacíos a null para campos opcionales
      const categoryId = category_id && category_id !== '' ? parseInt(category_id) : null;
      const supplierId = supplier_id && supplier_id !== '' ? parseInt(supplier_id) : null;
      const expirationDate = expiration_date && expiration_date !== '' ? expiration_date : null;
      const alertDays = alert_days_before_expiration ? parseInt(alert_days_before_expiration) : 7;

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
      const finalStock = isBulkProduct ? (stock_in_units || 0) : (stock || 0);
      const finalStockInUnits = isBulkProduct ? (stock_in_units || 0) : (stock || 0);

      console.log('🔍 Valores finales para insertar:');
      console.log('  - isBulkProduct:', isBulkProduct);
      console.log('  - finalSalePrice:', finalSalePrice);
      console.log('  - finalStock:', finalStock);
      console.log('  - finalStockInUnits:', finalStockInUnits);
      console.log('  - expirationDate:', expirationDate);
      console.log('  - alertDays:', alertDays);

      const result = await query(`
        INSERT INTO products (
          name, code, description, price, purchase_price, sale_price,
          stock, min_stock, category_id, supplier_id, image_url, sale_type,
          unit_of_measure, price_per_unit, stock_in_units, expiration_date, alert_days_before_expiration
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, name, code, sale_price, stock, image_url, sale_type, unit_of_measure, price_per_unit, stock_in_units, expiration_date, alert_days_before_expiration
      `, [
        name, code, description, finalSalePrice, purchase_price, finalSalePrice,
        finalStock, min_stock || 5, categoryId, supplierId, image_url, sale_type || 'unit',
        unit_of_measure || 'kg', price_per_unit || 0, finalStockInUnits, 
        expirationDate, alertDays
      ]);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error creando producto:', error);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        details: error.stack
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
        unit_of_measure, price_per_unit, stock_in_units, expiration_date, alert_days_before_expiration
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
          expiration_date = $16,
          alert_days_before_expiration = $17,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, code, sale_price, stock, image_url, sale_type, unit_of_measure, price_per_unit, stock_in_units, expiration_date, alert_days_before_expiration
      `, [
        id, name, code, description, purchase_price, sale_price,
        stock, min_stock, categoryId, supplierId, image_url, sale_type || 'unit',
        unit_of_measure || 'kg', price_per_unit || sale_price, stock_in_units || stock || 0,
        expiration_date || null, alert_days_before_expiration || 7
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
  },

  // Obtener productos próximos a vencer
  getNearExpiration: async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const daysInt = parseInt(days) || 7;

      console.log('🔍 Consultando productos próximos a vencer, días:', daysInt);

      // Consulta simplificada sin JOINs para evitar errores
      const result = await query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.expiration_date,
          p.stock,
          p.min_stock,
          p.sale_price,
          p.image_url,
          p.sale_type,
          p.unit_of_measure,
          p.price_per_unit,
          p.stock_in_units,
          (p.expiration_date - CURRENT_DATE) as days_until_expiration
        FROM products p
        WHERE p.expiration_date IS NOT NULL
        AND p.expiration_date <= (CURRENT_DATE + $1::integer)
        AND p.expiration_date > CURRENT_DATE
        AND p.is_active = true
        ORDER BY p.expiration_date ASC
      `, [daysInt]);

      console.log('✅ Productos próximos a vencer encontrados:', result.rows.length);

      res.json({
        success: true,
        data: result.rows || [],
        count: result.rows?.length || 0
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos próximos a vencer:', error);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        details: error.stack
      });
    }
  },

  // Obtener productos vencidos
  getExpired: async (req, res) => {
    try {
      console.log('🔍 Consultando productos vencidos');

      // Consulta simplificada sin JOINs para evitar errores
      const result = await query(`
        SELECT 
          p.id,
          p.name,
          p.code,
          p.expiration_date,
          p.stock,
          p.min_stock,
          p.sale_price,
          p.image_url,
          p.sale_type,
          p.unit_of_measure,
          p.price_per_unit,
          p.stock_in_units,
          (CURRENT_DATE - p.expiration_date) as days_expired
        FROM products p
        WHERE p.expiration_date IS NOT NULL
        AND p.expiration_date < CURRENT_DATE
        AND p.is_active = true
        ORDER BY p.expiration_date ASC
      `);

      console.log('✅ Productos vencidos encontrados:', result.rows.length);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos vencidos:', error);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        details: error.stack
      });
    }
  }
};

module.exports = productController;
