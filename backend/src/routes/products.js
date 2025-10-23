const express = require('express');
const productController = require('../controllers/productController');
const { upload, uploadToCloudinary } = require('../middleware/upload');
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

// GET /api/products - Obtener todos los productos
router.get('/', productController.getAll);

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', productController.getById);

// GET /api/products/code/:code - Obtener producto por código
router.get('/code/:code', productController.getByCode);

// POST /api/products - Crear nuevo producto
router.post('/', (req, res, next) => {
  console.log('🔍 Ruta POST /api/products - Iniciando');
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Content-Type:', req.headers['content-type']);
  next();
}, upload.single('image'), uploadToCloudinary, productController.create);

// PUT /api/products/:id - Actualizar producto
router.put('/:id', upload.single('image'), uploadToCloudinary, productController.update);

// DELETE /api/products/:id - Eliminar producto (soft delete)
router.delete('/:id', productController.delete);

module.exports = router;