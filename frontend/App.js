import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';

// Importar los contextos
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Importar la navegación principal
import AppNavigator from './src/navigation/AppNavigator';

// Componente interno que usa el tema
function AppContent() {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
