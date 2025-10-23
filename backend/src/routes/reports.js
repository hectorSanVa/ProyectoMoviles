const express = require('express');
const reportsController = require('../controllers/reportsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/reports/daily - Ventas del día
router.get('/daily', reportsController.getDailySales);

// GET /api/reports/top-products - Top productos más vendidos
router.get('/top-products', reportsController.getTopProducts);

// GET /api/reports/low-stock - Productos con stock bajo
router.get('/low-stock', reportsController.getLowStockProducts);

// GET /api/reports/summary - Resumen general
router.get('/summary', reportsController.getSummary);

module.exports = router;
