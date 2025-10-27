const { query } = require('../config/database');

const discountController = {
  // Obtener todos los descuentos
  getAll: async (req, res) => {
    try {
      const result = await query(
        'SELECT * FROM discounts ORDER BY created_at DESC'
      );
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo descuentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los descuentos'
      });
    }
  },

  // Obtener descuentos activos
  getActive: async (req, res) => {
    try {
      const result = await query(
        `SELECT * FROM discounts 
         WHERE is_active = true 
           AND start_date <= CURRENT_DATE 
           AND end_date >= CURRENT_DATE
         ORDER BY created_at DESC`
      );
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo descuentos activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los descuentos activos'
      });
    }
  },

  // Obtener un descuento por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await query('SELECT * FROM discounts WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Descuento no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error obteniendo descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el descuento'
      });
    }
  },

  // Crear un nuevo descuento
  create: async (req, res) => {
    try {
      const {
        name,
        description,
        discount_type,
        target_id,
        discount_percentage,
        start_date,
        end_date,
        is_active = true
      } = req.body;

      // Validaciones
      if (!name || !discount_type || !discount_percentage || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos obligatorios deben ser completados'
        });
      }

      if (!['product', 'category', 'global'].includes(discount_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de descuento inválido'
        });
      }

      if (discount_percentage < 0 || discount_percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de descuento debe estar entre 0 y 100'
        });
      }

      const result = await query(
        `INSERT INTO discounts (
          name, description, discount_type, target_id, 
          discount_percentage, start_date, end_date, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [name, description, discount_type, target_id, discount_percentage, start_date, end_date, is_active]
      );

      res.json({
        success: true,
        message: 'Descuento creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creando descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el descuento'
      });
    }
  },

  // Actualizar un descuento
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        discount_type,
        target_id,
        discount_percentage,
        start_date,
        end_date,
        is_active
      } = req.body;

      // Validar que el descuento existe
      const checkResult = await query('SELECT * FROM discounts WHERE id = $1', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Descuento no encontrado'
        });
      }

      // Validaciones
      if (discount_type && !['product', 'category', 'global'].includes(discount_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de descuento inválido'
        });
      }

      if (discount_percentage !== undefined && (discount_percentage < 0 || discount_percentage > 100)) {
        return res.status(400).json({
          success: false,
          message: 'El porcentaje de descuento debe estar entre 0 y 100'
        });
      }

      const result = await query(
        `UPDATE discounts SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          discount_type = COALESCE($3, discount_type),
          target_id = COALESCE($4, target_id),
          discount_percentage = COALESCE($5, discount_percentage),
          start_date = COALESCE($6, start_date),
          end_date = COALESCE($7, end_date),
          is_active = COALESCE($8, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *`,
        [name, description, discount_type, target_id, discount_percentage, start_date, end_date, is_active, id]
      );

      res.json({
        success: true,
        message: 'Descuento actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error actualizando descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el descuento'
      });
    }
  },

  // Eliminar un descuento
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await query('DELETE FROM discounts WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Descuento no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Descuento eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando descuento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el descuento'
      });
    }
  }
};

module.exports = discountController;

