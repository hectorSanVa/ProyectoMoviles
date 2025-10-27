const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const userController = {
  // Obtener todos los usuarios
  getAll: async (req, res) => {
    try {
      console.log('🔍 Obteniendo todos los usuarios...');
      const { role } = req.query;

      let whereClause = 'WHERE u.is_active = true';
      const params = [];

      if (role) {
        params.push(role);
        whereClause += ` AND r.name = $${params.length}`;
      }

      console.log('🔍 Query con parámetros:', params);

      const result = await query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.is_active,
          u.created_at,
          r.name as role_name,
          r.id as role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY u.created_at DESC
      `, params);

      console.log('✅ Usuarios encontrados:', result.rows.length);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        details: error.stack
      });
    }
  },

  // Obtener usuario por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.is_active,
          u.created_at,
          r.name as role_name,
          r.id as role_id,
          r.permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND u.is_active = true
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo usuario
  create: async (req, res) => {
    try {
      console.log('🔍 Body recibido:', req.body);
      const { username, email, password, role_name } = req.body;

      if (!username || !email || !password || !role_name) {
        console.log('❌ Faltan campos requeridos');
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Buscar el role_id basado en role_name
      const roleResult = await query(
        'SELECT id FROM roles WHERE name = $1',
        [role_name]
      );

      if (roleResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rol no válido'
        });
      }

      const roleId = roleResult.rows[0].id;

      // Verificar que el usuario no exista
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El usuario o email ya existe'
        });
      }

      // Hash de contraseña
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insertar usuario
      const result = await query(`
        INSERT INTO users (username, email, password_hash, role_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role_id, created_at
      `, [username, email, password_hash, roleId]);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        details: error.stack
      });
    }
  },

  // Actualizar usuario
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, password, role_name } = req.body;

      // Verificar que el usuario exista
      const userResult = await query(
        'SELECT id FROM users WHERE id = $1 AND is_active = true',
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const updates = [];
      const params = [];
      let paramCount = 0;

      if (username) {
        paramCount++;
        updates.push(`username = $${paramCount}`);
        params.push(username);
      }

      if (email) {
        paramCount++;
        updates.push(`email = $${paramCount}`);
        params.push(email);
      }

      if (password) {
        paramCount++;
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        updates.push(`password_hash = $${paramCount}`);
        params.push(password_hash);
      }

      if (role_name) {
        const roleResult = await query(
          'SELECT id FROM roles WHERE name = $1',
          [role_name]
        );

        if (roleResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Rol no válido'
          });
        }

        paramCount++;
        updates.push(`role_id = $${paramCount}`);
        params.push(roleResult.rows[0].id);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay campos para actualizar'
        });
      }

      paramCount++;
      params.push(id);
      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await query(`
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, username, email, role_id, updated_at
      `, params);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar usuario (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // No permitir auto-eliminación
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propio usuario'
        });
      }

      const result = await query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING id, username',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = userController;

