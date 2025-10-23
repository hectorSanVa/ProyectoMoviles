import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Card, Button, Title, Paragraph, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import RealBarcodeScanner from '../components/RealBarcodeScanner';

const ScannerScreen = ({ navigation }) => {
  const { addToCart } = useCart();
  const [showScanner, setShowScanner] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBarcodeScanned = async (barcode) => {
    console.log('🔍 Código escaneado:', barcode);
    setIsLoading(true);
    
    try {
      // Buscar producto por código
      const response = await productService.getByCode(barcode);
      
      if (response.success && response.data) {
        const product = response.data;
        setLastScannedProduct(product);
        
        // Mostrar información del producto
        Alert.alert(
          'Producto Encontrado',
          `Nombre: ${product.name}\nCódigo: ${product.code}\nPrecio: $${product.sale_price}\nStock: ${product.stock}`,
          [
            { 
              text: 'Cancelar', 
              style: 'cancel' 
            },
            { 
              text: 'Agregar al Carrito', 
              onPress: () => addProductToCart(product)
            }
          ]
        );
      } else {
        // Producto no encontrado - ofrecer crear
        Alert.alert(
          'Producto No Encontrado',
          `No se encontró producto con código: ${barcode}\n\n¿Deseas crear un nuevo producto?`,
          [
            { 
              text: 'Cancelar', 
              style: 'cancel' 
            },
            { 
              text: 'Crear Producto', 
              onPress: () => createNewProduct(barcode)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error buscando producto:', error);
      Alert.alert('Error', 'No se pudo buscar el producto');
    } finally {
      setIsLoading(false);
      setShowScanner(false);
    }
  };

  const addProductToCart = (product) => {
    try {
      const success = addToCart(product);
      if (success) {
        Alert.alert('Éxito', `${product.name} agregado al carrito`);
        setLastScannedProduct(null);
      } else {
        Alert.alert('Error', 'No se pudo agregar al carrito');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al agregar al carrito');
    }
  };

  const createNewProduct = (barcode) => {
    // Navegar a la pantalla de gestión de productos con el código prellenado
    navigation.navigate('ProductManagement', { 
      prefillCode: barcode,
      mode: 'create'
    });
  };

  const openScanner = () => {
    setShowScanner(true);
    setLastScannedProduct(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.title}>Escáner de Códigos</Title>
        <Paragraph style={styles.subtitle}>
          Escanea códigos de barras para buscar o crear productos
        </Paragraph>
      </View>

      {/* Botón principal de escaneo */}
      <Card style={styles.scannerCard}>
        <Card.Content style={styles.scannerContent}>
          <MaterialIcons name="qrcode-scanner" size={64} color="#4CAF50" />
          <Title style={styles.scannerTitle}>Escanear Código</Title>
          <Paragraph style={styles.scannerSubtitle}>
            Toca para abrir la cámara y escanear un código de barras
          </Paragraph>
          <Button 
            mode="contained" 
            onPress={openScanner}
            style={styles.scannerButton}
            icon="camera-alt"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Buscando...' : 'Abrir Escáner'}
          </Button>
        </Card.Content>
      </Card>

      {/* Información del último producto escaneado */}
      {lastScannedProduct && (
        <Card style={styles.productCard}>
          <Card.Content>
            <View style={styles.productHeader}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              <Title style={styles.productTitle}>Último Producto Escaneado</Title>
            </View>
            
            <View style={styles.productInfo}>
              <Paragraph style={styles.productName}>
                {lastScannedProduct.name}
              </Paragraph>
              <Paragraph style={styles.productCode}>
                Código: {lastScannedProduct.code}
              </Paragraph>
              <View style={styles.productDetails}>
                <Chip style={styles.priceChip}>
                  ${lastScannedProduct.sale_price}
                </Chip>
                <Chip style={styles.stockChip}>
                  Stock: {lastScannedProduct.stock}
                </Chip>
              </View>
            </View>

            <Button 
              mode="outlined" 
              onPress={() => addProductToCart(lastScannedProduct)}
              style={styles.addButton}
              icon="add-shopping-cart"
            >
              Agregar al Carrito
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Instrucciones */}
      <Card style={styles.instructionsCard}>
        <Card.Content>
          <Title style={styles.instructionsTitle}>¿Cómo funciona?</Title>
          <View style={styles.instructionItem}>
            <MaterialIcons name="camera-alt" size={20} color="#666" />
            <Paragraph style={styles.instructionText}>
              Escanea el código de barras del producto
            </Paragraph>
          </View>
          <View style={styles.instructionItem}>
            <MaterialIcons name="search" size={20} color="#666" />
            <Paragraph style={styles.instructionText}>
              El sistema busca el producto automáticamente
            </Paragraph>
          </View>
          <View style={styles.instructionItem}>
            <MaterialIcons name="add-shopping-cart" size={20} color="#666" />
            <Paragraph style={styles.instructionText}>
              Agrega el producto al carrito de ventas
            </Paragraph>
          </View>
          <View style={styles.instructionItem}>
            <MaterialIcons name="add-box" size={20} color="#666" />
            <Paragraph style={styles.instructionText}>
              Si no existe, puedes crear un nuevo producto
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Modal del escáner */}
      {showScanner && (
        <RealBarcodeScanner 
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  scannerCard: {
    marginBottom: 20,
    elevation: 4,
  },
  scannerContent: {
    alignItems: 'center',
    padding: 20,
  },
  scannerTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  scannerSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  scannerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
  },
  productCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: '#f8f9fa',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: '#333',
  },
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  priceChip: {
    backgroundColor: '#4CAF50',
  },
  stockChip: {
    backgroundColor: '#2196F3',
  },
  addButton: {
    borderColor: '#4CAF50',
  },
  instructionsCard: {
    elevation: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    marginLeft: 12,
    color: '#666',
    flex: 1,
  },
});

export default ScannerScreen;
