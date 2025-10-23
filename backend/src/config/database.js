const { Pool } = require('pg');
const config = require('./config');

// Configuración de la base de datos
const pool = new Pool(config.database);

// Función para probar la conexión
const testConnection = async () => {
  try {
    console.log('🔍 Intentando conectar a PostgreSQL...');
    console.log('🔍 DATABASE_URL disponible:', !!process.env.DATABASE_URL);
    console.log('🔍 Configuración de base de datos:', JSON.stringify(config.database, null, 2));
    
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.error('❌ Error completo:', err);
    process.exit(1);
  }
};

// Función para ejecutar consultas
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Error en query:', err);
    throw err;
  }
};

// Función para obtener un cliente del pool
const getClient = async () => {
  return await pool.connect();
};

// Función para cerrar el pool
const closePool = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  getClient,
  closePool,
  testConnection
};
