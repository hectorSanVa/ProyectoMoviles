require('dotenv').config();

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },

  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'inventario_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'mi_jwt_secret_super_seguro_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Configuración de archivos
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },

  // Configuración CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:19006',
    credentials: true,
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Configuración de la aplicación
  app: {
    name: 'Sistema de Inventario y Ventas',
    version: '1.0.0',
    url: process.env.APP_URL || 'http://localhost:3000',
  },
};

module.exports = config;

