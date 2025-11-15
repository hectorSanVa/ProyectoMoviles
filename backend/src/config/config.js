require('dotenv').config();

const config = {
  // Configuración de la base de datos
  database: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // SSL requerido para Render
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inventario_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '210504',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'mi_jwt_secret_super_seguro_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://192.168.1.83:19006',
    credentials: true,
  },

  // Configuración de archivos
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: process.env.MAX_FILE_SIZE || 5242880, // 5MB
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Entorno
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Hugging Face API
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    apiUrl: 'https://router.huggingface.co/hf-inference', // Nueva URL de Hugging Face
    // Cambiado a un modelo más confiable y rápido
    model: 'google/flan-t5-base', // Multilenguaje, siempre disponible, más rápido
    // Alternativas:
    // 'microsoft/DialoGPT-medium' - Conversacional pero puede estar en cold start
    // 'facebook/blenderbot-400M-distill' - Mejor para conversaciones pero más lento
  },
};

module.exports = config;