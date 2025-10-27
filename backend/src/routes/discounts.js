const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authMiddleware } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/discounts - Obtener todos los descuentos
router.get('/', discountController.getAll);

// GET /api/discounts/active - Obtener solo descuentos activos
router.get('/active', discountController.getActive);

// GET /api/discounts/:id - Obtener un descuento por ID
router.get('/:id', discountController.getById);

// POST /api/discounts - Crear un nuevo descuento
router.post('/', discountController.create);

// PUT /api/discounts/:id - Actualizar un descuento
router.put('/:id', discountController.update);

// DELETE /api/discounts/:id - Eliminar un descuento
router.delete('/:id', discountController.delete);

module.exports = router;

