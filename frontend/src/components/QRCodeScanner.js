import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const QRCodeScanner = ({ visible, onScan, onClose }) => {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('QR Escaneado:', data);
    
    Alert.alert(
      'Código Escaneado',
      `Código: ${data}`,
      [
        { text: 'Escanear otro', onPress: () => setScanned(false) },
        { 
          text: 'Agregar al Carrito', 
          onPress: () => {
            onScan(data);
            onClose();
          } 
        },
      ]
    );
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.permissionContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="camera-alt" size={64} color="#fff" />
          </View>
          <Text style={styles.title}>Permiso de Cámara</Text>
          <Text style={styles.text}>Necesitamos acceso a la cámara para escanear códigos QR</Text>
          <TouchableOpacity 
            style={[styles.buttonPrimary, { backgroundColor: theme.colors.primary }]} 
            onPress={requestPermission}
          >
            <Text style={styles.buttonPrimaryText}>Permitir Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={onClose}>
            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128'] }}
        >
          {/* Header con botón cerrar */}
          <View style={styles.header}>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} onPress={onClose}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escáner de Código QR</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Área central de escaneo - con viewfinder */}
          <View style={styles.scannerArea}>
            {/* Sombra superior */}
            <View style={styles.shadowTop} />
            
            {/* Vista central transparente */}
            <View style={styles.middleRow}>
              <View style={styles.shadowSide} />
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.shadowSide} />
            </View>
            
            {/* Sombra inferior */}
            <View style={styles.shadowBottom}>
              {!scanned ? (
                <>
                  <MaterialIcons name="qr-code" size={48} color={theme.colors.primary} />
                  <Text style={styles.instructionText}>
                    Alinea el código QR dentro del marco
                  </Text>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.scanAgainBtn, { backgroundColor: theme.colors.primary }]} 
                  onPress={() => setScanned(false)}
                >
                  <MaterialIcons name="refresh" size={24} color="#fff" />
                  <Text style={styles.scanAgainText}>Escanear Nuevamente</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scannerArea: {
    flex: 1,
  },
  shadowTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 300,
  },
  shadowSide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanFrame: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    borderColor: '#fff',
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    width: 50,
    height: 50,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    width: 50,
    height: 50,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    width: 50,
    height: 50,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    width: 50,
    height: 50,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  shadowBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  scanAgainBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonPrimary: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  buttonSecondaryText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default QRCodeScanner;
