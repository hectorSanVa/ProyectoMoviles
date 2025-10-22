const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { query } = require('../src/config/database');

// Función para ejecutar el script de esquema
const initDatabase = async () => {
  try {
    console.log(' Inicializando base de datos...');
    
    // Leer el archivo de esquema
    const schemaPath = path.join(__dirname, '../src/config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Ejecutar el esquema
    await query(schema);
    
    console.log(' Base de datos inicializada correctamente');
    console.log(' Tablas creadas:');
    console.log('   - users (usuarios)');
    console.log('   - suppliers (proveedores)');
    console.log('   - categories (categorías)');
    console.log('   - products (productos)');
    console.log('   - sales (ventas)');
    console.log('   - sale_items (detalles de venta)');
    console.log('   - stock_movements (movimientos de stock)');
    console.log('');
    console.log(' Usuario administrador creado:');
    console.log('   Usuario: admin');
    console.log('   Email: admin@inventario.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('  Categorías iniciales creadas');
    
  } catch (error) {
    console.error(' Error inicializando base de datos:', error.message);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log(' Inicialización completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error(' Error:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
