# 🚀 Guía de Instalación - Sistema de Inventario y Ventas

## 📋 Prerrequisitos

### Software Necesario
- **Node.js** (v16 o superior) - [Descargar aquí](https://nodejs.org/)
- **PostgreSQL** (v12 o superior) - [Descargar aquí](https://www.postgresql.org/download/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Expo CLI** (para frontend) - `npm install -g @expo/cli`

### Para Desarrollo Móvil
- **Android Studio** (para Android) - [Descargar aquí](https://developer.android.com/studio)
- **Xcode** (para iOS, solo macOS) - Desde App Store

## 🛠️ Instalación Paso a Paso

### 1. Clonar el Proyecto
```bash
git clone <tu-repositorio>
cd ProyectoMoviles
```

### 2. Configurar Backend

#### 2.1 Instalar Dependencias
```bash
cd backend
npm install
```

#### 2.2 Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar el archivo .env con tus datos
# Usar cualquier editor de texto
```

**Configuración mínima del archivo `.env`:**
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventario_db
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres

# JWT
JWT_SECRET=mi_jwt_secret_super_seguro_2024

# Servidor
PORT=3000
```

#### 2.3 Configurar Base de Datos PostgreSQL

1. **Crear base de datos:**
```sql
-- Conectar a PostgreSQL como superusuario
psql -U postgres

-- Crear base de datos
CREATE DATABASE inventario_db;

-- Crear usuario (opcional)
CREATE USER inventario_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE inventario_db TO inventario_user;
```

2. **Ejecutar esquema:**
```bash
# Opción 1: Usar el script automático
npm run init-db

# Opción 2: Manual
psql -U postgres -d inventario_db -f src/config/schema.sql
```

#### 2.4 Ejecutar Backend
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

**Verificar que funciona:**
- Abrir navegador en: `http://localhost:3000`
- Deberías ver: `{"message":"API de Sistema de Inventario y Ventas","version":"1.0.0","status":"running"}`

### 3. Configurar Frontend

#### 3.1 Instalar Dependencias
```bash
cd ../frontend
npm install
```

#### 3.2 Configurar Variables de Entorno
```bash
# Crear archivo .env
echo "API_BASE_URL=http://localhost:3000/api" > .env
```

#### 3.3 Ejecutar Frontend
```bash
# Iniciar Expo
npm start

# Para Android
npm run android

# Para iOS
npm run ios
```

## 🔧 Configuración Adicional

### Base de Datos en la Nube (Opcional)

#### Supabase
1. Crear cuenta en [Supabase](https://supabase.com/)
2. Crear nuevo proyecto
3. Obtener URL de conexión
4. Actualizar variables en `.env`:
```env
DB_HOST=db.tu-proyecto.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_de_supabase
```

#### Railway
1. Crear cuenta en [Railway](https://railway.app/)
2. Conectar repositorio
3. Agregar servicio PostgreSQL
4. Obtener variables de entorno automáticamente

### Deploy del Backend

#### Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Heroku
```bash
# Instalar Heroku CLI
# Crear app
heroku create tu-app-inventario

# Configurar variables
heroku config:set DB_HOST=tu-host
heroku config:set DB_PASSWORD=tu-password
# ... otras variables

# Deploy
git push heroku main
```

## 🧪 Verificar Instalación

### Backend
```bash
# Probar API
curl http://localhost:3000

# Respuesta esperada:
# {"message":"API de Sistema de Inventario y Ventas","version":"1.0.0","status":"running"}
```

### Frontend
1. Abrir Expo Go en tu móvil
2. Escanear QR code
3. La app debería cargar

### Base de Datos
```sql
-- Conectar a la base de datos
psql -U postgres -d inventario_db

-- Verificar tablas
\dt

-- Verificar usuario admin
SELECT username, email, role FROM users WHERE username = 'admin';
```

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que PostgreSQL esté corriendo
# Windows: Servicios > PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Verificar conexión
psql -U postgres -h localhost
```

### Error de Puerto en Uso
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -ti:3000 | xargs kill
```

### Error de Dependencias
```bash
# Limpiar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📱 Configuración Móvil

### Android
1. Habilitar "Opciones de desarrollador"
2. Habilitar "Depuración USB"
3. Instalar Expo Go desde Play Store

### iOS
1. Instalar Expo Go desde App Store
2. Conectar a la misma red WiFi

## 🎯 Próximos Pasos

1. **Configurar autenticación** - Implementar login/logout
2. **Crear CRUD de productos** - Gestión de inventario
3. **Implementar ventas** - Flujo de ventas
4. **Agregar escáner** - Códigos de barras
5. **Crear reportes** - Estadísticas y análisis

## 📞 Soporte

Si tienes problemas:
1. Revisar logs del servidor
2. Verificar variables de entorno
3. Comprobar conexión a base de datos
4. Revisar documentación de Expo/React Native

