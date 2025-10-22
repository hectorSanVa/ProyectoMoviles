import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
        // Login exitoso
        await login(response.data.user, response.data.token);
        Alert.alert('Éxito', 'Inicio de sesión exitoso');
      } else {
        Alert.alert('Error', response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Sistema de Inventario</Title>
          <Paragraph style={styles.subtitle}>
            Inicia sesión para continuar
          </Paragraph>
          
          <TextInput
            label="Usuario"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Iniciar Sesión
          </Button>
          
          <Paragraph style={styles.credentials}>
            Usuario: admin{'\n'}
            Contraseña: admin123
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 24,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  credentials: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: '#666',
  },
});

export default LoginScreen;

