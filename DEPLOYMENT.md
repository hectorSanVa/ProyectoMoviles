# 🚀 Guía de Despliegue - Sistema POS

## Despliegue del Backend en Railway

### 1. Crear cuenta en Railway
- Ve a [railway.app](https://railway.app)
- Conéctate con GitHub
- Autoriza Railway para acceder a tu repositorio

### 2. Crear nuevo proyecto
- Haz clic en "New Project"
- Selecciona "Deploy from GitHub repo"
- Busca: `hectorSanVa/ProyectoMoviles`
- Selecciona la carpeta `backend` como directorio raíz

### 3. Configurar Base de Datos PostgreSQL
- En Railway, haz clic en "New" → "Database" → "PostgreSQL"
- Railway creará automáticamente las variables de entorno de la BD

### 4. Variables de Entorno Requeridas
Configura estas variables en Railway:

```
NODE_ENV=production
PORT=3000
DB_HOST=tu-host-de-postgres
DB_PORT=5432
DB_NAME=tu-nombre-de-bd
DB_USER=tu-usuario
DB_PASSWORD=tu-password
JWT_SECRET=tu-jwt-secret-muy-seguro
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### 5. Desplegar
- Railway comenzará a construir automáticamente
- Una vez completado, obtendrás una URL como: `https://tu-proyecto.railway.app`

### 6. Configurar Base de Datos
Después del despliegue, ejecuta el script de configuración:
```bash
curl -X POST https://tu-proyecto.railway.app/api/setup-database
```

## Despliegue del Frontend (EAS Build)

### 1. Configurar EAS
```bash
cd frontend
npx eas build:configure
```

### 2. Generar APK
```bash
npx eas build --platform android --profile production
```

### 3. Descargar APK
- Ve a [expo.dev](https://expo.dev)
- Descarga el APK generado
- Instala en tu dispositivo Android

## URLs Importantes
- **Backend:** `https://tu-proyecto.railway.app`
- **Health Check:** `https://tu-proyecto.railway.app/api/health`
- **API Docs:** `https://tu-proyecto.railway.app/api`

## Solución de Problemas
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Railway para errores
- Asegúrate de que la base de datos esté conectada
