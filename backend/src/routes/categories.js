const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/categories - Obtener todas las categorías
router.get('/', categoryController.getAll);

// GET /api/categories/:id - Obtener categoría por ID
router.get('/:id', categoryController.getById);

// POST /api/categories - Crear nueva categoría
router.post('/', categoryController.create);

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', categoryController.update);

// DELETE /api/categories/:id - Eliminar categoría
router.delete('/:id', categoryController.delete);

// GET /api/categories/:id/products - Obtener productos de una categoría
router.get('/:id/products', categoryController.getProducts);

module.exports = router;
