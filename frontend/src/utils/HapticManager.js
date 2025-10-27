import * as Haptics from 'expo-haptics';

class HapticManager {
  constructor() {
    this.isEnabled = true;
  }

  // Reproducir vibración de escaneo
  async playScanHaptic() {
    if (!this.isEnabled) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Error reproduciendo vibración de escaneo:', error);
    }
  }

  // Reproducir vibración de agregar al carrito
  async playAddToCartHaptic() {
    if (!this.isEnabled) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Error reproduciendo vibración de agregar:', error);
    }
  }

  // Reproducir vibración de venta exitosa
  async playSaleSuccessHaptic() {
    if (!this.isEnabled) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error reproduciendo vibración de venta:', error);
    }
  }

  // Reproducir vibración de error
  async playErrorHaptic() {
    if (!this.isEnabled) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.log('Error reproduciendo vibración de error:', error);
    }
  }

  // Habilitar/deshabilitar vibración
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Instancia global
export const hapticManager = new HapticManager();
export default hapticManager;
