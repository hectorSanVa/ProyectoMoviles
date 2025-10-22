const { query } = require('./src/config/database');
require('dotenv').config();

const checkUser = async () => {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    // Verificar si existe el usuario admin
    const result = await query('SELECT id, username, email, role FROM users WHERE username = $1', ['admin']);
    
    if (result.rows.length > 0) {
      console.log('✅ Usuario admin encontrado:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Username:', result.rows[0].username);
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
    } else {
      console.log('❌ Usuario admin NO encontrado');
      console.log('🔧 Creando usuario admin...');
      
      // Crear usuario admin
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await query(`
        INSERT INTO users (username, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, ['admin', 'admin@inventario.com', hashedPassword, 'admin']);
      
      console.log('✅ Usuario admin creado exitosamente');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
    
    // Mostrar todos los usuarios
    const allUsers = await query('SELECT id, username, email, role FROM users');
    console.log('\n📋 Todos los usuarios en la base de datos:');
    allUsers.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.username} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkUser().then(() => {
  console.log('\n🎉 Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
