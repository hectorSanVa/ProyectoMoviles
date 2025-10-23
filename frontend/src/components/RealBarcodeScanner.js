// Comentado para Expo Go - expo-barcode-scanner no funciona en Expo Go
/*
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
*/

// Componente temporal para Expo Go
const RealBarcodeScanner = ({ onScan, onClose }) => {
  // Simular escáner real - solo para desarrollo
  const handleSimulatedScan = () => {
    const simulatedCode = '1234567890123';
    if (onScan) {
      onScan(simulatedCode);
    }
    onClose();
  };

  return null; // No renderizar nada en Expo Go
};

// Estilos comentados para Expo Go
/*
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
*/

export default RealBarcodeScanner;
