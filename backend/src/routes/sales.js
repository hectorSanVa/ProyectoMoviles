const express = require('express');
const salesController = require('../controllers/salesController');
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

// Aplicar middleware a todas las rutas
router.use(verifyToken);

// GET /api/sales/summary/by-user - Resumen de ventas por usuario (solo admin)
router.get('/summary/by-user', salesController.getSalesSummaryByUser);

// GET /api/sales - Obtener ventas
router.get('/', salesController.getAll);

// GET /api/sales/user/:userId - Obtener ventas por usuario
router.get('/user/:userId', salesController.getByUser);

// GET /api/sales/:id - Obtener venta por ID con detalles
router.get('/:id', salesController.getById);

// POST /api/sales - Crear nueva venta
router.post('/', salesController.create);

// GET /api/sales/reports/daily - Reporte de ventas del día
router.get('/reports/daily', salesController.getDailyReport);

module.exports = router;