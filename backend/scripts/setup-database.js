const { query } = require('../src/config/database');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🔄 Configurando base de datos completa...');

    // 1. Eliminar todas las tablas existentes (CUIDADO: esto borra todo)
    console.log('🗑️  Limpiando base de datos existente...');
    
    const dropTables = [
      'DROP TABLE IF EXISTS stock_movements CASCADE',
      'DROP TABLE IF EXISTS sale_items CASCADE', 
      'DROP TABLE IF EXISTS sales CASCADE',
      'DROP TABLE IF EXISTS products CASCADE',
      'DROP TABLE IF EXISTS categories CASCADE',
      'DROP TABLE IF EXISTS suppliers CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];

    for (const dropQuery of dropTables) {
      try {
        await query(dropQuery);
        console.log(`✅ Eliminado: ${dropQuery.split(' ')[4]}`);
      } catch (error) {
        console.log(`⚠️  ${dropQuery.split(' ')[4]}: ${error.message}`);
      }
    }

    // 2. Eliminar funciones y triggers
    console.log('🧹 Limpiando funciones y triggers...');
    await query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
    await query('DROP FUNCTION IF EXISTS generate_sale_number() CASCADE');
    await query('DROP FUNCTION IF EXISTS set_sale_number() CASCADE');

    // 3. Crear tablas con estructura completa
    console.log('📋 Creando tablas...');

    // Tabla de usuarios
    await query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'cashier')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de proveedores
    await query(`
      CREATE TABLE suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de categorías
    await query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de productos
    await query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        purchase_price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2) NOT NULL,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        category_id INTEGER REFERENCES categories(id),
        supplier_id INTEGER REFERENCES suppliers(id),
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de ventas
    await query(`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        sale_number VARCHAR(20) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        customer_name VARCHAR(100) DEFAULT 'Cliente general',
        subtotal DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')),
        payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de detalles de venta
    await query(`
      CREATE TABLE sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de movimientos de stock
    await query(`
      CREATE TABLE stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        movement_type VARCHAR(20) CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return')),
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reference_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Crear índices
    console.log('📊 Creando índices...');
    const indexes = [
      'CREATE INDEX idx_products_code ON products(code)',
      'CREATE INDEX idx_products_category ON products(category_id)',
      'CREATE INDEX idx_products_supplier ON products(supplier_id)',
      'CREATE INDEX idx_sales_date ON sales(created_at)',
      'CREATE INDEX idx_sales_user ON sales(user_id)',
      'CREATE INDEX idx_sale_items_sale ON sale_items(sale_id)',
      'CREATE INDEX idx_sale_items_product ON sale_items(product_id)',
      'CREATE INDEX idx_stock_movements_product ON stock_movements(product_id)',
      'CREATE INDEX idx_stock_movements_date ON stock_movements(created_at)'
    ];

    for (const indexQuery of indexes) {
      await query(indexQuery);
    }

    // 5. Crear funciones y triggers
    console.log('⚙️  Creando funciones y triggers...');

    // Función para updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Triggers para updated_at
    await query('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    await query('CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    await query('CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');

    // Función para generar número de venta
    await query(`
      CREATE OR REPLACE FUNCTION generate_sale_number()
      RETURNS TEXT AS $$
      DECLARE
          new_number TEXT;
          counter INTEGER;
      BEGIN
          SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 4) AS INTEGER)), 0) + 1
          INTO counter
          FROM sales
          WHERE sale_number LIKE 'VEN%';
          
          new_number := 'VEN' || LPAD(counter::TEXT, 6, '0');
          RETURN new_number;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Función para setear número de venta
    await query(`
      CREATE OR REPLACE FUNCTION set_sale_number()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
              NEW.sale_number := generate_sale_number();
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await query('CREATE TRIGGER trigger_set_sale_number BEFORE INSERT ON sales FOR EACH ROW EXECUTE FUNCTION set_sale_number()');

    // 6. Insertar datos iniciales
    console.log('📝 Insertando datos iniciales...');

    // Categorías
    await query(`
      INSERT INTO categories (name, description) VALUES 
      ('Electrónicos', 'Productos electrónicos y tecnológicos'),
      ('Ropa', 'Vestimenta y accesorios'),
      ('Hogar', 'Artículos para el hogar'),
      ('Deportes', 'Equipos y artículos deportivos'),
      ('Libros', 'Libros y material educativo'),
      ('Alimentos', 'Productos alimenticios'),
      ('Bebidas', 'Bebidas y refrescos'),
      ('Limpieza', 'Productos de limpieza')
    `);

    // Proveedores
    await query(`
      INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES 
      ('Distribuidora Central', 'Juan Pérez', 'juan@distribuidora.com', '555-0101', 'Av. Principal 123'),
      ('Suministros del Norte', 'María García', 'maria@suministros.com', '555-0102', 'Calle Norte 456'),
      ('Proveedor Express', 'Carlos López', 'carlos@express.com', '555-0103', 'Zona Industrial 789')
    `);

    // Usuarios
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const testPassword = await bcrypt.hash('admin123', 10);

    await query(`
      INSERT INTO users (name, username, email, password_hash, role, is_active) VALUES 
      ('Administrador', 'admin', 'admin@inventario.com', $1, 'admin', true),
      ('Usuario Test', 'test', 'test@inventario.com', $2, 'admin', true)
    `, [adminPassword, testPassword]);

    // Productos de ejemplo
    await query(`
      INSERT INTO products (name, code, description, purchase_price, sale_price, stock, min_stock, category_id, supplier_id) VALUES 
      ('Coca Cola 500ml', '1234567890123', 'Refresco de cola 500ml', 8.50, 12.00, 50, 10, 6, 1),
      ('Pan Bimbo', '2345678901234', 'Pan de caja blanco', 15.00, 20.00, 30, 5, 6, 2),
      ('Detergente Ariel', '3456789012345', 'Detergente en polvo 1kg', 25.00, 35.00, 20, 5, 8, 3),
      ('Smartphone Samsung', '4567890123456', 'Teléfono inteligente', 8000.00, 12000.00, 5, 2, 1, 1),
      ('Camiseta Nike', '5678901234567', 'Camiseta deportiva', 150.00, 250.00, 15, 3, 2, 2)
    `);

    console.log('✅ Base de datos configurada correctamente');
    console.log('📊 Datos iniciales:');
    console.log('   - 8 categorías');
    console.log('   - 3 proveedores');
    console.log('   - 2 usuarios (admin/test)');
    console.log('   - 5 productos de ejemplo');
    console.log('');
    console.log('👤 Usuarios disponibles:');
    console.log('   - admin / admin123');
    console.log('   - test / admin123');
    console.log('');
    console.log('🎯 La base de datos está lista para usar');

  } catch (error) {
    console.error('❌ Error configurando base de datos:', error.message);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Configuración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };

