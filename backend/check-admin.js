require('dotenv').config();
const { query } = require('./src/config/database');

async function checkAdmin() {
  try {
    console.log('🔍 Verificando usuario admin...');
    
    const result = await query(`
      SELECT id, username, email, role, is_active 
      FROM users 
      WHERE username = 'admin'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Usuario admin encontrado:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Username:', result.rows[0].username);
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
      console.log('   Activo:', result.rows[0].is_active);
    } else {
      console.log('❌ Usuario admin NO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdmin();

