# Backend - Sistema de Inventario y Ventas

API REST desarrollada con Node.js y Express para el sistema de inventario y ventas.

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Configuración
1. Copiar archivo de variables de entorno:
```bash
cp env.example .env
```

2. Configurar variables en `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventario_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_muy_seguro
PORT=3000
```

### Base de Datos
1. Crear base de datos PostgreSQL
2. Ejecutar script de esquema:
```bash
psql -U tu_usuario -d inventario_db -f src/config/schema.sql
```

### Ejecutar
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📁 Estructura

```
backend/
├── src/
│   ├── controllers/    # Lógica de negocio
│   ├── models/         # Modelos de datos
│   ├── routes/         # Definición de rutas
│   ├── middleware/     # Middleware personalizado
│   └── config/         # Configuración
├── uploads/           # Archivos subidos
├── package.json
└── server.js
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/products/:id` - Obtener producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `GET /api/sales/:id` - Obtener venta

### Reportes
- `GET /api/reports/sales` - Reporte de ventas
- `GET /api/reports/products` - Reporte de productos
- `GET /api/reports/stock` - Reporte de stock

## 🛡️ Seguridad

- Contraseñas hasheadas con bcryptjs
- Autenticación JWT
- Validación de entrada con express-validator
- CORS configurado
- Helmet para headers de seguridad

## 📊 Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `products` - Productos
- `suppliers` - Proveedores
- `sales` - Ventas
- `sale_items` - Detalles de venta
- `stock_movements` - Movimientos de stock

### Características
- Triggers automáticos para updated_at
- Generación automática de números de venta
- Índices para optimización
- Relaciones entre tablas

