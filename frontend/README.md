# Frontend - Sistema de Inventario y Ventas

Aplicación móvil desarrollada con React Native y Expo para el sistema de inventario y ventas.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (v16 o superior)
- Expo CLI: `npm install -g @expo/cli`
- Android Studio (para Android)
- Xcode (para iOS, solo en macOS)

### Instalación
```bash
npm install
```

### Ejecutar
```bash
# Desarrollo
npm start

# Android
npm run android

# iOS
npm run ios
```

## 📱 Características

### Funcionalidades
- **Autenticación**: Login con JWT
- **Productos**: CRUD de productos con imágenes
- **Ventas**: Flujo completo de ventas
- **Escáner**: Cámara para códigos de barras
- **Inventario**: Gestión de stock
- **Reportes**: Gráficos y estadísticas
- **Offline**: Funcionamiento sin conexión

### Tecnologías
- **React Native** + **Expo**
- **React Navigation** - Navegación
- **React Native Paper** - UI Components
- **Expo Barcode Scanner** - Escáner de códigos
- **AsyncStorage** - Persistencia local
- **Axios** - HTTP client

## 📁 Estructura

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── screens/        # Pantallas de la app
│   │   ├── auth/       # Login, registro
│   │   ├── products/   # Gestión de productos
│   │   ├── sales/      # Proceso de ventas
│   │   ├── inventory/  # Inventario
│   │   └── reports/    # Reportes
│   ├── navigation/     # Configuración de navegación
│   ├── services/       # API calls
│   ├── utils/          # Utilidades
│   └── context/        # Context API
├── assets/            # Imágenes y recursos
├── App.js
└── package.json
```

## 🎨 Pantallas

### Autenticación
- **LoginScreen**: Inicio de sesión
- **RegisterScreen**: Registro de usuarios

### Principal
- **HomeScreen**: Dashboard principal
- **ProductsScreen**: Lista de productos
- **SalesScreen**: Proceso de ventas
- **InventoryScreen**: Gestión de inventario
- **ReportsScreen**: Reportes y estadísticas
- **ProfileScreen**: Perfil de usuario

## 🔧 Configuración

### Variables de Entorno
Crear archivo `.env`:
```env
API_BASE_URL=http://localhost:3000/api
```

### Navegación
- **Stack Navigator**: Para flujos de autenticación
- **Tab Navigator**: Para navegación principal
- **Drawer Navigator**: Para menú lateral (opcional)

## 📦 Build y Deploy

### Android
```bash
# Build APK
eas build --platform android

# Submit a Play Store
eas submit --platform android
```

### iOS
```bash
# Build para iOS
eas build --platform ios

# Submit a App Store
eas submit --platform ios
```

## 🛠️ Desarrollo

### Estructura de Componentes
```javascript
// Ejemplo de componente
import React from 'react';
import { View, Text } from 'react-native';
import { Card, Title } from 'react-native-paper';

const ProductCard = ({ product }) => {
  return (
    <Card>
      <Card.Content>
        <Title>{product.name}</Title>
        <Text>Precio: ${product.price}</Text>
      </Card.Content>
    </Card>
  );
};
```

### Servicios API
```javascript
// Ejemplo de servicio
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const productService = {
  getAll: () => axios.get(`${API_BASE_URL}/products`),
  create: (product) => axios.post(`${API_BASE_URL}/products`, product),
  update: (id, product) => axios.put(`${API_BASE_URL}/products/${id}`, product),
  delete: (id) => axios.delete(`${API_BASE_URL}/products/${id}`),
};
```

## 📱 Características Móviles

### Escáner de Códigos
- Integración con cámara
- Soporte para códigos EAN/UPC
- Validación automática

### Persistencia Local
- AsyncStorage para datos temporales
- Sincronización con backend
- Modo offline

### UI/UX
- Material Design con React Native Paper
- Navegación intuitiva
- Responsive design

