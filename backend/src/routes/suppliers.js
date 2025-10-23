const express = require('express');
const supplierController = require('../controllers/supplierController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/suppliers - Obtener todos los proveedores
router.get('/', supplierController.getAll);

// GET /api/suppliers/:id - Obtener proveedor por ID
router.get('/:id', supplierController.getById);

// POST /api/suppliers - Crear nuevo proveedor
router.post('/', supplierController.create);

// PUT /api/suppliers/:id - Actualizar proveedor
router.put('/:id', supplierController.update);

// DELETE /api/suppliers/:id - Eliminar proveedor
router.delete('/:id', supplierController.delete);

// GET /api/suppliers/:id/products - Obtener productos de un proveedor
router.get('/:id/products', supplierController.getProducts);

module.exports = router;
