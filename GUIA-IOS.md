# Guía para Desplegar en iPhone

## ✅ SÍ, tu proyecto funciona en iPhone

Tu aplicación ya está configurada para iOS. **React Native + Expo** es multiplataforma, así que el mismo código funciona en Android e iOS.

---

## 🚀 Opción 1: Build de Producción (Recomendada para iPhone)

### Requisitos:
- ✅ Cuenta de Apple Developer ($99 USD/año)
- ✅ No necesitas Mac física, EAS Build lo hace en la nube

### Pasos:

```bash
cd frontend

# 1. Crear build para iOS
eas build --platform ios --profile production
```

EAS Build en la nube compilará tu app para iOS automáticamente. **No necesitas una Mac.**

### ¿Qué va a pasar?
1. EAS compilará tu app en sus servidores
2. Generará un archivo `.ipa` (similar al `.apk` de Android)
3. Podrás descargarlo desde el dashboard de Expo
4. Lo instalas en tu iPhone usando **TestFlight** o instalación directa

---

## 🧪 Opción 2: Testing con Expo Go (Más Rápido)

### Para probar en iPhone sin build:

```bash
cd frontend

# Iniciar servidor de desarrollo
npm start

# Escanear QR con Expo Go app en tu iPhone
```

**Descarga Expo Go** en tu iPhone desde App Store y escanea el QR que aparece en tu terminal.

**Limitación**: No tendrás todas las funcionalidades nativas (cámara puede funcionar diferente).

---

## 📱 Opción 3: TestFlight (Distribución Beta)

Para instalar en múltiples iPhones sin App Store:

```bash
# 1. Build para TestFlight
eas build --platform ios --profile production

# 2. Subir a TestFlight
eas submit --platform ios
```

Esto genera un enlace para que instalen desde TestFlight (límite de 100 beta testers sin cuota de desarrollador adicional).

---

## 🔑 Requisitos de Cuenta Apple Developer

Si quieres publicar o usar TestFlight necesitas:

1. **Ir a**: https://developer.apple.com
2. **Pagar**: $99 USD al año
3. **Crear cuenta**: Te pedirán datos personales y tarjeta

**¿Vale la pena?**
- ✅ Si planeas publicar en App Store: SÍ
- ✅ Si solo quieres probar en tu iPhone: Puedes usar Expo Go gratis
- ✅ Si quieres distribuir a clientes: TestFlight es la mejor opción

---

## 📝 Pasos Detallados para Build de Producción

### 1. Crear cuenta Apple Developer

Ve a: https://developer.apple.com/register

### 2. Configurar credenciales en EAS

```bash
cd frontend
eas credentials
```

Sigue las instrucciones. EAS te pedirá:
- Tu email de Apple Developer
- Generará automáticamente los certificados

### 3. Build para iOS

```bash
eas build --platform ios --profile production
```

**Tiempo estimado**: 20-30 minutos

### 4. Instalar en iPhone

Una vez terminado el build:
1. Ve a: https://expo.dev
2. Entra a tu proyecto
3. Descarga el archivo `.ipa`
4. Importa a tu iPhone (puedes usar TestFlight o instalarlo directamente)

---

## ⚠️ Diferencias entre Android e iOS

### Lo que FUNCIONA IGUAL:
- ✅ Toda la funcionalidad core (ventas, inventario, reportes)
- ✅ Diseño e interfaz
- ✅ Lógica de negocio
- ✅ Backend y API
- ✅ Base de datos

### Posibles DIFERENCIAS:
- 📸 Cámara: Permisos manejan diferente (ya configurado)
- ⌨️ Teclado: iOS puede comportarse ligeramente diferente
- 📱 UI: Android Material vs iOS Cupertino (mayormente igual en tu app)
- 🔔 Notificaciones: Requieren configuración adicional si las implementas

---

## 🆚 Comparación: Android vs iOS

| Característica | Android | iOS |
|----------------|---------|-----|
| **Costo Build** | Gratis | $99 USD/año |
| **Tiempo Build** | 10-20 min | 20-30 min |
| **Facilidad** | ✅ Muy fácil | ✅ Fácil con EAS |
| **Publicación** | Gratis (Play Store) | $99 USD (App Store) |
| **Distribución** | .APK | .IPA + TestFlight |
| **Testing Local** | ✅ Sí (USB) | ✅ Sí (Apple Developer) |

---

## 💡 Recomendación

**Para tu caso (proyecto académico):**

1. **Si solo quieres probar**: Usa Expo Go en tu iPhone (gratis, rápido)

2. **Si quieres demostrar que funciona**: Haz build de iOS con EAS ($99 USD)

3. **Si quieres distribuir**: Publica solo en Google Play (gratis) y comenta que iOS también funciona

---

## 🎯 Comando Único para Build de iOS

Si tienes cuenta de Apple Developer:

```bash
cd frontend
eas build --platform ios --profile production
```

Eso es todo. EAS hace el resto automáticamente.

---

## ❓ FAQs

**P: ¿Necesito Mac física?**
R: No, EAS Build lo hace en la nube.

**P: ¿Cuánto cuesta?**
R: $99 USD/año para publicar en App Store. TestFlight incluido.

**P: ¿Puedo usar Expo Go gratis?**
R: Sí, pero limitado a funcionalidades de Expo sin código nativo extra.

**P: ¿Mi código funciona igual en iOS?**
R: Sí, es el mismo código React Native. Funciona igual.

**P: ¿Cómo lo instalo en mi iPhone después del build?**
R: Usa TestFlight o instalación directa vía iTunes/EAS.

---

## 🚀 ¡Empieza Ahora!

```bash
# Para probar rápido (Expo Go)
cd frontend && npm start

# Para build de producción (requiere Apple Developer)
cd frontend && eas build --platform ios
```

¡Buena suerte! 🎉

