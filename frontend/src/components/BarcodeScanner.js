import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
// import { BarCodeScanner } from 'expo-barcode-scanner'; // Disabled for Expo Go
import { MaterialIcons } from '@expo/vector-icons';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Códigos de ejemplo para simular
  const sampleCodes = [
    '1234567890123',
    '9876543210987',
    '5555555555555',
    '1111111111111',
    '2222222222222'
  ];

  const handleManualScan = () => {
    if (manualCode.trim()) {
      if (onScan) {
        onScan(manualCode.trim());
      }
      setManualCode('');
      setShowManualInput(false);
    } else {
      Alert.alert('Error', 'Por favor ingresa un código');
    }
  };

  const handleRandomScan = () => {
    const randomCode = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
    if (onScan) {
      onScan(randomCode);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialIcons name="qr-code-scanner" size={64} color="#2196F3" />
          <Text style={styles.title}>Escáner de Códigos</Text>
          <Text style={styles.subtitle}>
            En Expo Go, el escáner real no está disponible
          </Text>
          <Text style={styles.description}>
            Puedes ingresar el código manualmente o usar un código de ejemplo
          </Text>

          {!showManualInput ? (
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                onPress={() => setShowManualInput(true)}
                style={styles.button}
                icon="keyboard"
              >
                Ingresar Código Manualmente
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={handleRandomScan}
                style={styles.button}
                icon="shuffle"
              >
                Usar Código de Ejemplo
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={onClose}
                style={styles.button}
                icon="close"
              >
                Cerrar
              </Button>
            </View>
          ) : (
            <View style={styles.manualInputContainer}>
              <TextInput
                placeholder="Ingresa el código de barras"
                value={manualCode}
                onChangeText={setManualCode}
                style={styles.textInput}
                keyboardType="numeric"
                autoFocus
              />
              
              <View style={styles.manualButtons}>
                <Button 
                  mode="contained" 
                  onPress={handleManualScan}
                  style={styles.manualButton}
                  icon="check"
                >
                  Escanear
                </Button>
                
                <Button 
                  mode="outlined" 
                  onPress={() => setShowManualInput(false)}
                  style={styles.manualButton}
                  icon="arrow-left"
                >
                  Atrás
                </Button>
              </View>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Códigos de ejemplo disponibles:</Text>
            {sampleCodes.map((code, index) => (
              <Text key={index} style={styles.codeExample}>
                {code}
              </Text>
            ))}
          </View>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#888',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginVertical: 8,
    width: '100%',
  },
  manualInputContainer: {
    width: '100%',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  manualButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  manualButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  infoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  codeExample: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default BarcodeScanner;