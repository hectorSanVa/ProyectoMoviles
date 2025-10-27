# Cómo Agregar Ícono Personalizado a tu App

## 🎨 Lo que necesitas

Tu aplicación actualmente usa el ícono por defecto. Puedes agregar un ícono personalizado fácilmente.

## 📝 Pasos para Agregar Ícono

### Opción 1: Usar Herramienta Online (FÁCIL)

1. **Ve a**: https://easyappicon.com/ (o https://icon.kitchen)
2. **Sube** tu imagen (mejor si es cuadrada, 1024x1024px)
3. **Descarga** todos los íconos generados
4. **Copia** los archivos a `frontend/assets/`
5. **Actualiza** `app.json`

### Opción 2: Usar Expo CLI (RECOMENDADA)

```bash
cd frontend

# Si tienes una imagen llamada icon.png en la carpeta assets
npx expo install @expo/configure-splash-screen

# O simplemente pon tu imagen en assets/icon.png (1024x1024px)
```

Luego actualiza `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png"
  }
}
```

### Opción 3: Manual (MUY SIMPLE)

1. **Crea** una imagen cuadrada (1024x1024px):
   - Puedes usar: Canva, Figma, Photoshop, o incluso PowerPoint
   - Debe ser cuadrada
   - Resolución: 1024x1024 pixels

2. **Guárdala** como:
   - `frontend/assets/icon.png`

3. **En `app.json`**, ya está configurado para buscar `./assets/icon.png`

4. **Genera el build**:

```bash
cd frontend
eas build --platform android --profile preview
```

## 🎨 Ideas para tu Ícono

Basándome en tu imagen compartida, podrías usar:

### Idea 1: Simplificar tu diseño actual
- Robot de Android azul
- Fondo degradado verde-azul
- Texto "Sistema Inventario" (opcional, solo si se lee bien en pequeño)

### Idea 2: Diseño Minimalista
- Emoji 📦 en gran tamaño
- Fondo azul/verde sólido
- Simple y limpio

### Idea 3: Diseño Profesional
- Logo de almacén/cajón
- Icono de inventario abstracto
- Colores corporativos (azul/verde)

## 📱 Logo de tu Imagen Actual

Tu imagen actual tiene:
- Robot de Android blanco
- Fondo verde-azulado con cuadrícula
- Bordes negros

**Sugerencia**: 
- Quita el borde negro
- Usa solo el robot de Android
- Fondo degradado suave (como en tu splash screen)
- Asegúrate que sea 1024x1024px

## ⚡ Pasos Rápidos

### Si quieres usar tu imagen actual:

1. **Crea una imagen 1024x1024px** con:
   - Robot de Android (como el de tu imagen)
   - Fondo verde-azul degradado (sin bordes negros)
   - Guarda como: `frontend/assets/icon.png`

2. **Verifica que `app.json` tenga**:
```json
"icon": "./assets/icon.png"
```

3. **Haz build**:
```bash
cd frontend
eas build --platform android --profile preview
```

## 🎯 Formatos Soportados

- ✅ PNG (recomendado)
- ✅ JPG
- ✅ SVG (puede no funcionar en todos lados)

## ⚠️ Recomendaciones

- **Tamaño**: Mínimo 1024x1024px, preferiblemente más grande
- **Fondo**: Transparente o de color sólido
- **Texto**: Evítalo a menos que sea muy grande
- **Detalles**: Manténlo simple, se verá pequeño en el teléfono
- **Contraste**: Alto contraste para visibilidad

## 🔧 Si no quieres un ícono personalizado

Puedes dejarlo como está. La app funcionará perfectamente con el ícono por defecto de Expo (una bandera de Expo).

---

## 💡 Herramientas Gratis

Para crear un ícono:

1. **Canva** (https://canva.com)
   - Gratis
   - Plantillas de íconos
   - Exporta PNG

2. **Figma** (https://figma.com)
   - Gratis
   - Editor profesional
   - Exporta PNG

3. **GIMP** (https://gimp.org)
   - Gratis, código abierto
   - Photoshop-like
   - Exporta PNG

---

## ✅ Resumen

**Lo más fácil**: 
1. Crea imagen 1024x1024px con Canva
2. Guárdala como `frontend/assets/icon.png`
3. `eas build --platform android`

**¿Quieres que te ayude a crear el ícono?** Puedo darte las especificaciones exactas o recomendarte un diseño basado en tu app.

