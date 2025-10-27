import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

const LoadingScreen = () => {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Logo/Icono */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>📦</Text>
          <Text style={styles.logoText}>INVENTARIO</Text>
        </View>
        
        {/* Spinner */}
        <ActivityIndicator size="large" color="#ffffff" />
        
        {/* Texto de carga */}
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    opacity: 0.9,
  },
});

export default LoadingScreen;

