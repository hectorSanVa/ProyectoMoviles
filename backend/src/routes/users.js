const express = require('express');
const userController = require('../controllers/userController');
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

// Middleware para verificar que sea admin
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción'
    });
  }
  next();
};

// Aplicar middleware a todas las rutas
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAll);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getById);

// POST /api/users - Crear nuevo usuario
router.post('/', userController.create);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', userController.update);

// DELETE /api/users/:id - Eliminar usuario (soft delete)
router.delete('/:id', userController.delete);

module.exports = router;

