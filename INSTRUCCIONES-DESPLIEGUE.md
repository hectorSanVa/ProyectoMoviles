# 📱 Instrucciones de Despliegue - Sistema de Inventario y Ventas

## 🎯 Objetivo
Desplegar el backend en la nube y compilar la aplicación móvil para instalarla en dispositivos Android.

---

## 📋 PASO 1: Preparar Base de Datos en la Nube

### Opción A: Usar Render (Recomendado, GRATIS)

1. Ve a https://render.com
2. Crea una cuenta gratuita
3. Crea una nueva **PostgreSQL Database**
   - Plan: Free
   - Nombre: `inventario-db`
   - NOTA: Copia la **Internal Database URL** (la necesitarás)

### Opción B: Usar Railway (Alternativa)

1. Ve a https://railway.app
2. Crea una cuenta
3. Crea un nuevo proyecto → PostgreSQL Database
4. Copia la **DATABASE_URL**

---

## 🌐 PASO 2: Desplegar Backend en Render

### 1. Crear cuenta en Render
- Ve a https://render.com y crea una cuenta (gratis)

### 2. Conectar tu repositorio
1. En Render, ve a **Dashboard** → **New** → **Web Service**
2. Selecciona **GitHub** o **GitLab**
3. Conecta tu repositorio del proyecto
4. Selecciona la rama `main` o `master`

### 3. Configurar el servicio
- **Name:** `inventario-api`
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free

### 4. Agregar Variables de Entorno
En la sección **Environment**, agrega:

```env
NODE_ENV=production
DATABASE_URL=[La URL de tu base de datos de PostgreSQL]
JWT_SECRET=[Un string aleatorio muy seguro, ejemplo: tu_clave_secreta_super_segura_2024]
CLOUDINARY_CLOUD_NAME=[Tu cloud name de Cloudinary]
CLOUDINARY_API_KEY=[Tu API Key de Cloudinary]
CLOUDINARY_API_SECRET=[Tu API Secret de Cloudinary]
```

### 5. Desplegar
- Haz clic en **Create Web Service**
- Render empezará a desplegar automáticamente
- Espera a que termine (5-10 minutos)

### 6. Copiar URL del Backend
Una vez desplegado, copia la URL de tu servicio:
```
https://tu-servicio.onrender.com
```

---

## 💾 PASO 3: Configurar Base de Datos

### 1. Inicializar la Base de Datos
Necesitas ejecutar los scripts SQL para crear las tablas.

**Opción 1: Desde tu computadora local**
1. Conecta tu PostgreSQL local con la base de datos en la nube
2. Ejecuta el script `backup-final-limpio.sql` completo

**Opción 2: Usar pgAdmin o DBeaver**
1. Descarga pgAdmin: https://www.pgadmin.org
2. Conecta a tu base de datos en Render (usando la Internal Database URL)
3. Ejecuta el script `backup-final-limpio.sql`

**Opción 3: Usar el script de inicialización** (si existe)
```bash
cd backend
node scripts/init-db.js
```

---

## 📱 PASO 4: Compilar la Aplicación Móvil

### 1. Instalar EAS CLI
```bash
npm install -g eas-cli
```

### 2. Configurar Expo
```bash
cd frontend
npm install
eas login
```

### 3. Configurar el proyecto para EAS Build
```bash
eas build:configure
```

Esto creará un archivo `eas.json` (ya existe)

### 4. Actualizar URL del Backend

Edita `frontend/src/services/api.js` y cambia:

```javascript
const API_BASE_URL = 'https://tu-servicio.onrender.com';
```

### 5. Compilar para Android
```bash
eas build --platform android --profile production
```

Esto tomará 10-20 minutos. Al finalizar, te dará una URL para descargar el APK.

### 6. Instalar la App
1. Abre la URL del APK en tu dispositivo Android
2. Descarga e instala el APK
3. Acepta instalar apps de fuentes desconocidas si te lo pide

---

## ✅ PASO 5: Probar la Aplicación

1. Abre la app en tu Android
2. Intenta iniciar sesión con tus credenciales de admin
3. Prueba todas las funcionalidades:
   - Ver productos
   - Crear venta
   - Generar reportes
   - Etc.

---

## 🔧 Troubleshooting

### Problema: La app no conecta al backend
- Verifica que la URL en `api.js` sea correcta
- Asegúrate de que el backend esté corriendo en Render

### Problema: Error de conexión a la base de datos
- Verifica que la DATABASE_URL esté correcta en Render
- Asegúrate de que la base de datos esté inicializada

### Problema: No puedo compilar con EAS
- Asegúrate de tener una cuenta de Expo
- Verifica que `eas.json` esté configurado correctamente

---

## 📝 Lista de Verificación Final

- [ ] Base de datos PostgreSQL creada en la nube
- [ ] Backend desplegado en Render
- [ ] Variables de entorno configuradas
- [ ] Base de datos inicializada con las tablas
- [ ] URL del backend actualizada en `api.js`
- [ ] APK compilado con EAS Build
- [ ] Aplicación instalada en el dispositivo
- [ ] Login funcionando
- [ ] Funcionalidades principales probadas

---

## 🎉 ¡Listo!

Tu aplicación está lista para usar en dispositivos Android. Puedes compartir el APK con otras personas para que lo instalen en sus dispositivos.

**NOTA:** Para producción real, necesitarías:
- Dominio propio
- SSL/HTTPS
- Base de datos con respaldos
- Actualizaciones de seguridad
- Publicación en Google Play Store


