import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');

  const handleManualScan = () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa un código');
      return;
    }
    
    console.log('Código ingresado manualmente:', manualCode);
    
    // Llamar a la función onScan con el código
    if (onScan) {
      onScan(manualCode);
    }
    
    setManualCode('');
    onClose();
  };

  const simulateScan = () => {
    // Simular códigos de prueba
    const testCodes = [
      '1234567890123',
      '9876543210987',
      'PROD001',
      'TEST123'
    ];
    
    const randomCode = testCodes[Math.floor(Math.random() * testCodes.length)];
    
    Alert.alert(
      'Código simulado',
      `Código: ${randomCode}`,
      [
        { text: 'Usar este código', onPress: () => {
          if (onScan) {
            onScan(randomCode);
          }
          onClose();
        }},
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialIcons name="qr-code-scanner" size={48} color="#2196F3" />
          <Text style={styles.title}>Escáner de Códigos</Text>
          <Text style={styles.subtitle}>
            En modo desarrollo, puedes ingresar el código manualmente
          </Text>
          
          <TextInput
            label="Código de barras"
            value={manualCode}
            onChangeText={setManualCode}
            style={styles.input}
            mode="outlined"
            placeholder="Ingresa el código aquí"
          />
          
          <Button 
            mode="contained" 
            onPress={handleManualScan}
            style={styles.button}
            icon="check"
          >
            Buscar Producto
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={simulateScan}
            style={styles.button}
            icon="auto-fix"
          >
            Simular Escaneo
          </Button>
          
          <Button 
            mode="text" 
            onPress={onClose}
            style={styles.button}
            icon="close"
          >
            Cerrar
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    marginBottom: 8,
  },
});

export default BarcodeScanner;
