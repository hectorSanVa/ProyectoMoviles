require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

async function createTestUser() {
  try {
    console.log('🔧 Creando usuario de prueba...');
    
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario de prueba
    await query(`
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = $3,
        is_active = $5
    `, ['test', 'test@inventario.com', hashedPassword, 'admin', true]);
    
    console.log('✅ Usuario de prueba creado:');
    console.log('   Username: test');
    console.log('   Password: admin123');
    console.log('   Email: test@inventario.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();

