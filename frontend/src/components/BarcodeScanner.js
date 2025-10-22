import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { MaterialIcons } from '@expo/vector-icons';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('Código escaneado:', { type, data });
    
    // Llamar a la función onScan con el código
    if (onScan) {
      onScan(data);
    }
    
    // Mostrar alerta
    Alert.alert(
      'Código escaneado',
      `Código: ${data}`,
      [
        { text: 'Escanear otro', onPress: () => setScanned(false) },
        { text: 'Cerrar', onPress: onClose }
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <Card style={styles.container}>
        <Card.Content style={styles.content}>
          <MaterialIcons name="camera-alt" size={48} color="#666" />
          <Text style={styles.message}>Solicitando permisos de cámara...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card style={styles.container}>
        <Card.Content style={styles.content}>
          <MaterialIcons name="camera-alt" size={48} color="#666" />
          <Text style={styles.message}>Sin acceso a la cámara</Text>
          <Text style={styles.subMessage}>
            Necesitamos acceso a la cámara para escanear códigos de barras
          </Text>
          <Button 
            mode="contained" 
            onPress={getCameraPermissions}
            style={styles.button}
          >
            Permitir cámara
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
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[
          BarCodeScanner.Constants.BarCodeType.qr,
          BarCodeScanner.Constants.BarCodeType.pdf417,
          BarCodeScanner.Constants.BarCodeType.aztec,
          BarCodeScanner.Constants.BarCodeType.ean13,
          BarCodeScanner.Constants.BarCodeType.ean8,
          BarCodeScanner.Constants.BarCodeType.code128,
          BarCodeScanner.Constants.BarCodeType.code39,
          BarCodeScanner.Constants.BarCodeType.codabar,
          BarCodeScanner.Constants.BarCodeType.upc_e,
          BarCodeScanner.Constants.BarCodeType.upc_a,
        ]}
      />
      
      {/* Overlay con instrucciones */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Apunta la cámara al código de barras
          </Text>
          <Text style={styles.subInstructionText}>
            El código se detectará automáticamente
          </Text>
        </View>
      </View>
      
      {/* Botones de control */}
      <View style={styles.controls}>
        <Button 
          mode="contained" 
          onPress={() => setScanned(false)}
          style={styles.controlButton}
        >
          Escanear otro
        </Button>
        <Button 
          mode="outlined" 
          onPress={onClose}
          style={styles.controlButton}
        >
          Cerrar
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    marginTop: 16,
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
  },
  scanArea: {
    width: 250,
    height: 150,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00ff00',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subInstructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default BarcodeScanner;
