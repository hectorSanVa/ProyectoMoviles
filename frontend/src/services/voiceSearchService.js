import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// Idioma para reconocimiento de voz y síntesis
const VOICE_LANGUAGE = 'es-MX';

export const voiceSearchService = {
  /**
   * Hablar un texto (síntesis de voz)
   */
  speak: (text, options = {}) => {
    const { onDone, onError, pitch = 1.0, rate = 0.9 } = options;
    
    return Speech.speak(text, {
      language: VOICE_LANGUAGE,
      pitch,
      rate,
      quality: Speech.VoiceQuality.Enhanced,
      onDone: () => {
        console.log('✅ Hablado completado:', text);
        if (onDone) onDone();
      },
      onError: (error) => {
        console.error('❌ Error hablando:', error);
        if (onError) onError(error);
      },
    });
  },

  /**
   * Hablar una cantidad de forma inteligente
   */
  speakQuantity: (quantity, unit = '') => {
    const text = unit ? `${quantity.toFixed(2)} ${unit}` : `${quantity} unidades`;
    return Speech.speak(text, {
      language: VOICE_LANGUAGE,
      rate: 0.9,
    });
  },

  /**
   * Detener lo que está hablando
   */
  stop: () => {
    Speech.stop();
  },

  /**
   * Hablar cuando se encuentra un producto
   */
  speakProductFound: (product, count) => {
    if (count === 0) {
      voiceSearchService.speak('No se encontraron productos', { rate: 0.85 });
    } else if (count === 1) {
      voiceSearchService.speak(`Producto encontrado: ${product.name}`, { rate: 0.85 });
    } else {
      voiceSearchService.speak(`Se encontraron ${count} productos`, { rate: 0.85 });
    }
  },

  /**
   * Hablar cuando se agrega un producto al carrito
   */
  speakProductAdded: (productName) => {
    voiceSearchService.speak(`${productName} agregado al carrito`, { rate: 0.9 });
  },

  /**
   * Hablar el total de la venta (en pesos mexicanos)
   */
  speakSaleTotal: (total) => {
    const pesos = Math.floor(total);
    const centavos = Math.round((total - pesos) * 100);
    
    let text = `Total a pagar: ${pesos} pesos`;
    if (centavos > 0) {
      text += ` con ${centavos} centavos`;
    }
    
    voiceSearchService.speak(text, { rate: 0.85 });
  },

  /**
   * Hablar mensajes de estado
   */
  speakStatus: (message, options = {}) => {
    const defaultRate = 0.85;
    voiceSearchService.speak(message, { rate: options.rate || defaultRate, ...options });
  },

  /**
   * Verificar si las voces están disponibles
   */
  checkAvailability: async () => {
    try {
      // En iOS necesitas permisos especiales para voz
      if (Platform.OS === 'ios') {
        // Verificar si hay voces disponibles
        const voices = await Speech.getAvailableVoicesAsync();
        return voices.length > 0;
      }
      // En Android funciona por defecto
      return true;
    } catch (error) {
      console.error('Error verificando voces:', error);
      return false;
    }
  }
};

