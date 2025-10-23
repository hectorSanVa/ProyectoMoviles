import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';

// Importar el contexto de autenticación
import { AuthProvider } from './src/context/AuthContext';
// Importar el contexto del carrito
import { CartProvider } from './src/context/CartContext';

// Importar la navegación principal
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
