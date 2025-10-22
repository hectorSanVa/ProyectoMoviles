# Sistema de Inventario y Ventas

Sistema completo de gestión de inventario y ventas desarrollado con React Native para móviles y Node.js para el backend.

## 🚀 Características

### Funcionalidades Principales
- **Autenticación**: Login/logout con roles (admin, user, cashier)
- **Gestión de Productos**: CRUD completo con códigos EAN/UPC
- **Gestión de Proveedores**: Administración de proveedores
- **Inventario**: Listado con búsqueda y filtrado
- **Ventas**: Flujo completo de ventas con escáner de códigos
- **Reportes**: Ventas por día, productos más vendidos, stock bajo
- **Escáner**: Cámara para escanear códigos de barras
- **Sincronización**: Persistencia local con sincronización

### Tecnologías

#### Backend
- **Node.js** + **Express**
- **PostgreSQL** (Supabase/Railway)
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Multer** para manejo de archivos

#### Frontend
- **React Native** + **Expo**
- **React Navigation** para navegación
- **React Native Paper** para UI
- **Expo Barcode Scanner** para escáner
- **AsyncStorage** para persistencia local
- **Axios** para API calls

## 📁 Estructura del Proyecto

```
ProyectoMoviles/
├── backend/                 # API REST con Node.js
│   ├── src/
│   │   ├── controllers/    # Controladores de la API
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middleware personalizado
│   │   └── config/         # Configuración y BD
│   ├── uploads/           # Archivos subidos
│   ├── package.json
│   └── server.js
├── frontend/               # App móvil React Native
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── screens/        # Pantallas de la app
│   │   ├── navigation/     # Configuración de navegación
│   │   ├── services/       # Servicios API
│   │   ├── utils/          # Utilidades
│   │   └── context/        # Context API
│   ├── assets/            # Imágenes y recursos
│   ├── package.json
│   └── App.js
└── README.md
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn
- PostgreSQL
- Expo CLI
- Android Studio / Xcode (para desarrollo móvil)

### Backend

1. **Instalar dependencias**:
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp env.example .env
   # Editar .env con tus credenciales
   ```

3. **Configurar base de datos**:
   - Crear base de datos PostgreSQL
   - Ejecutar el script `src/config/schema.sql`

4. **Ejecutar servidor**:
   ```bash
   npm run dev
   ```

### Frontend

1. **Instalar dependencias**:
   ```bash
   cd frontend
   npm install
   ```

2. **Ejecutar aplicación**:
   ```bash
   npm start
   ```

## 📱 Funcionalidades por Implementar

### Backend
- [ ] Rutas de autenticación
- [ ] CRUD de productos
- [ ] CRUD de proveedores
- [ ] API de ventas
- [ ] Sistema de reportes
- [ ] Middleware de validación
- [ ] Upload de imágenes

### Frontend
- [ ] Pantalla de login
- [ ] Pantalla de productos
- [ ] Pantalla de ventas
- [ ] Escáner de códigos
- [ ] Pantalla de inventario
- [ ] Reportes
- [ ] Sincronización offline

## 🔧 Configuración de Desarrollo

### Base de Datos
El esquema incluye las siguientes tablas:
- `users` - Usuarios del sistema
- `suppliers` - Proveedores
- `categories` - Categorías de productos
- `products` - Productos
- `sales` - Ventas
- `sale_items` - Detalles de venta
- `stock_movements` - Movimientos de stock

### API Endpoints (Por implementar)
- `POST /api/auth/login` - Autenticación
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `GET /api/reports/sales` - Reporte de ventas

## 📄 Licencia

MIT License

## 👨‍💻 Autor

Hector - Proyecto Final de Desarrollo Móvil

