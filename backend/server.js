const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());

// Configuración CORS más específica para aplicaciones móviles
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.83:3000', 'http://192.168.1.83:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(compression());
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'API de Sistema de Inventario y Ventas',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint para Railway
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check llamado');
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'PostgreSQL Railway'
  });
});

// Rutas de la API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/sales', require('./src/routes/sales'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/suppliers', require('./src/routes/suppliers'));
app.use('/api/reports', require('./src/routes/reports'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🔍 Puerto:', PORT);
    console.log('🔍 Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')));
    
    // Probar conexión a la base de datos
    await testConnection();
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📱 API disponible en: http://localhost:${PORT}`);
      console.log(`📱 API disponible en: http://192.168.1.83:${PORT}`);
      console.log(`🗄️  Base de datos: ${process.env.DB_NAME || 'inventario_db'}`);
      console.log('✅ Servidor iniciado correctamente');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    console.error('❌ Error completo:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

startServer();
