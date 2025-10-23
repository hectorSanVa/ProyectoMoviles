import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const RealBarcodeScanner = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getBarCodeScannerPermissions();
  }, []);

  const getBarCodeScannerPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    console.log('🔍 Código escaneado:', { type, data });
    
    // Llamar a la función de callback con el código escaneado
    if (onScan) {
      onScan(data);
    }
    
    // Mostrar alerta de confirmación
    Alert.alert(
      'Código Escaneado',
      `Código: ${data}\nTipo: ${type}`,
      [
        { text: 'Escanear Otro', onPress: () => setScanned(false) },
        { text: 'Cerrar', onPress: onClose }
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <MaterialIcons name="camera-alt" size={48} color="#666" />
            <Title style={styles.title}>Solicitando Permisos</Title>
            <Paragraph style={styles.subtitle}>
              Permitiendo acceso a la cámara...
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <MaterialIcons name="camera-alt" size={48} color="#f44336" />
            <Title style={styles.title}>Sin Acceso a la Cámara</Title>
            <Paragraph style={styles.subtitle}>
              Necesitamos acceso a la cámara para escanear códigos de barras.
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={getBarCodeScannerPermissions}
              style={styles.button}
            >
              Permitir Cámara
            </Button>
            <Button 
              mode="outlined" 
              onPress={onClose}
              style={styles.button}
            >
              Cerrar
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Overlay con instrucciones */}
      <View style={styles.overlay}>
        <View style={styles.instructions}>
          <MaterialIcons name="qr-code-scanner" size={32} color="#fff" />
          <Text style={styles.instructionText}>
            Apunta la cámara al código de barras
          </Text>
          <Text style={styles.instructionSubtext}>
            El código se escaneará automáticamente
          </Text>
        </View>
      </View>

      {/* Botones de control */}
      <View style={styles.controls}>
        <Button 
          mode="contained" 
          onPress={onClose}
          style={styles.closeButton}
          icon="close"
        >
          Cerrar
        </Button>
        {scanned && (
          <Button 
            mode="outlined" 
            onPress={() => setScanned(false)}
            style={styles.scanButton}
            icon="refresh"
          >
            Escanear Otro
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  card: {
    margin: 20,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 10,
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  button: {
    marginTop: 15,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  instructionSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    flex: 1,
    marginRight: 10,
  },
  scanButton: {
    flex: 1,
    marginLeft: 10,
  },
});

export default RealBarcodeScanner;
