import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Roboto',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: '100',
    },
  },
};

const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    // Colores principales optimizados
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0D47A1',
    secondary: '#FF9800',
    secondaryContainer: '#FFF3E0',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#E65100',
    tertiary: '#4CAF50',
    tertiaryContainer: '#E8F5E8',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#1B5E20',
    error: '#F44336',
    errorContainer: '#FFEBEE',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    // Colores de superficie optimizados
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    surfaceContainer: '#FAFAFA',
    surfaceContainerHigh: '#F0F0F0',
    surfaceContainerHighest: '#E0E0E0',
    surfaceContainerLow: '#F8F8F8',
    surfaceContainerLowest: '#FFFFFF',
    surfaceDim: '#DDDDDD',
    surfaceBright: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    // Colores de fondo
    background: '#F8F9FA',
    onBackground: '#212121',
    // Colores de borde y outline
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',
    // Colores adicionales personalizados
    primaryDark: '#1976D2',
    primaryLight: '#BBDEFB',
    secondaryDark: '#F57C00',
    secondaryLight: '#FFE0B2',
    textSecondary: '#757575',
    textLight: '#9E9E9E',
    textOnPrimary: '#FFFFFF',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    // Colores principales optimizados para modo oscuro - MÁS SUAVES Y PROFESIONALES
    primary: '#81C784', // Verde suave profesional
    primaryContainer: '#2E7D32', // Verde oscuro para contenedores
    onPrimary: '#000000',
    onPrimaryContainer: '#E8F5E8', // Texto claro sobre primaryContainer
    secondary: '#FFB74D', // Naranja suave
    secondaryContainer: '#E65100', // Naranja oscuro para contenedores
    onSecondary: '#000000',
    onSecondaryContainer: '#FFF3E0', // Texto claro sobre secondaryContainer
    tertiary: '#64B5F6', // Azul suave
    tertiaryContainer: '#1565C0', // Azul oscuro para contenedores
    onTertiary: '#000000',
    onTertiaryContainer: '#E3F2FD', // Texto claro sobre tertiaryContainer
    error: '#EF5350', // Rojo error
    errorContainer: '#C62828', // Rojo oscuro para contenedores
    onError: '#000000',
    onErrorContainer: '#FFEBEE', // Texto claro sobre errorContainer
    // Colores de superficie optimizados para modo oscuro
    surface: '#1A1A1A', // Un poco más claro para mejor contraste
    surfaceVariant: '#2C2C2C',
    surfaceContainer: '#242424', // Más claro para mejor contraste
    surfaceContainerHigh: '#2E2E2E',
    surfaceContainerHighest: '#383838',
    surfaceContainerLow: '#1F1F1F',
    surfaceContainerLowest: '#0F0F0F',
    surfaceDim: '#0A0A0A',
    surfaceBright: '#333333',
    onSurface: '#E8E8E8', // Texto más claro y legible
    onSurfaceVariant: '#B8B8B8', // Texto secundario más claro
    // Colores de fondo
    background: '#0F0F0F', // Fondo más oscuro y elegante
    onBackground: '#E8E8E8',
    // Colores de borde y outline
    outline: '#404040',
    outlineVariant: '#333333',
    // Colores adicionales personalizados
    primaryDark: '#1976D2',
    primaryLight: '#BBDEFB',
    secondaryDark: '#F57C00',
    secondaryLight: '#FFE0B2',
    textSecondary: '#B8B8B8', // Más claro
    textLight: '#808080',
    textOnPrimary: '#FFFFFF',
    border: '#404040',
    borderLight: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    success: '#66BB6A', // Verde más suave
    warning: '#FFA726', // Naranja más suave
    info: '#42A5F5', // Azul más suave
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Cargar preferencia guardada
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error cargando tema:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error guardando tema:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};