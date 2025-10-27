import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, Dimensions, Text } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import { AnimatedButton, AnimatedCard } from '../../components/AnimatedComponents';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();

  // Animaciones
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Llamada real a la API
      const response = await authService.login(username, password);
      
      if (response.success) {
        // Guardar datos de autenticación
        await login(
          response.data.user, 
          response.data.token, 
          response.data.permissions, 
          response.data.role
        );
      } else {
        Alert.alert('Error', response.message || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.background}>
        <View style={[styles.gradientOverlay, { backgroundColor: theme.colors.primary + '20' }]} />
      </View>
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <AnimatedCard style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={8}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <MaterialIcons 
                name="store" 
                size={60} 
                color={theme.colors.primary} 
              />
            </View>

            <Title style={[styles.title, { color: theme.colors.text }]}>Sistema POS</Title>
            <Paragraph style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Punto de Venta Inteligente
            </Paragraph>
            
            <View style={styles.formContainer}>
              <TextInput
                label="Usuario"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
                left={<TextInput.Icon icon="account" />}
                theme={theme}
              />
              
              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                left={<TextInput.Icon icon="lock" />}
                theme={theme}
              />
              
              <AnimatedButton
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                icon="login"
                color={theme.colors.primary}
              />
            </View>
            
            <View style={styles.credentialsContainer}>
              <Paragraph style={[styles.credentialsTitle, { color: theme.colors.textSecondary }]}>
                Credenciales de Prueba:
              </Paragraph>
              <View style={[styles.credentialsBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Paragraph style={[styles.credentialsText, { color: theme.colors.textSecondary }]}>
                  👑 <Text style={styles.bold}>Admin:</Text> admin / admin123
                </Paragraph>
                <Paragraph style={[styles.credentialsText, { color: theme.colors.textSecondary }]}>
                  💰 <Text style={styles.bold}>Cajero:</Text> usuario / admin123
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </AnimatedCard>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  credentialsContainer: {
    marginTop: 16,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  credentialsBox: {
    padding: 12,
    borderRadius: 8,
  },
  credentialsText: {
    fontSize: 12,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;