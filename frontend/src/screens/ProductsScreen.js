import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl, Modal, Image, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Searchbar, Chip, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import BarcodeScanner from '../components/BarcodeScanner';

const ProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const { addToCart } = useCart();

  // Función para refrescar productos (puede ser llamada desde otras pantallas)
  const refreshProducts = () => {
    console.log('🔄 ProductsScreen: Refresco manual iniciado...');
    loadProducts();
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  // Refrescar productos cuando se complete una venta
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 ProductsScreen: Refresco automático...');
      loadProducts();
    }, 5000); // Refrescar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Refrescar cuando se regrese a la pantalla
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      console.log('🔄 ProductsScreen: Pantalla enfocada, refrescando...');
      loadProducts();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Cargar todos los productos sin filtro de búsqueda
      const response = await productService.getAll();
      if (response.success) {
        console.log('🔄 ProductsScreen: Refrescando productos...');
        console.log('📦 Productos cargados:', response.data.length);
        
        // Log detallado del stock de productos a granel
        response.data.forEach(product => {
          if (product.sale_type === 'weight') {
            console.log(`📦 Producto a granel ${product.name}: stock_in_units=${product.stock_in_units}, stock=${product.stock}`);
          }
        });
        
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    loadProducts();
  };

  const handleBarcodeScanned = (barcode) => {
    console.log('Código escaneado:', barcode);
    // Buscar producto por código
    setSearchQuery(barcode);
    loadProducts();
    setShowScanner(false);
  };

  const handleAddToCart = (product) => {
    const success = addToCart(product, null, handleShowWeightModal);
    if (success) {
      Alert.alert(
        'Producto Agregado', 
        `${product.name} agregado al carrito.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleShowWeightModal = (product) => {
    setSelectedProduct(product);
    setWeightInput('');
    setShowWeightModal(true);
  };

  const handleAddWeight = () => {
    const weight = parseFloat(weightInput);
    if (weight > 0 && selectedProduct) {
      const success = addToCart(selectedProduct, weight);
      if (success) {
        Alert.alert('Producto Agregado', `${selectedProduct.name} (${weight}${selectedProduct.unit_of_measure || 'kg'}) se ha añadido al carrito.`);
        setShowWeightModal(false);
        setSelectedProduct(null);
        setWeightInput('');
      }
    } else {
      Alert.alert('Error', 'Ingrese un peso válido mayor a 0');
    }
  };

  const openScanner = () => {
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
  };

  const renderProduct = ({ item }) => {
    console.log('Producto renderizado:', item.name, 'Image URL:', item.image_url);
    return (
      <Card style={styles.productCard}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.noImagePlaceholder]}>
                  <MaterialIcons name="image" size={24} color="#ccc" />
                </View>
              )}
              <View style={styles.productText}>
                <Title style={styles.productName}>{item.name}</Title>
                <Paragraph style={styles.productCode}>Código: {item.code}</Paragraph>
                <Paragraph style={styles.productPrice}>
                  Precio: ${item.sale_type === 'weight' ? `${item.price_per_unit}/${item.unit_of_measure || 'kg'}` : item.sale_price}
                </Paragraph>
              </View>
            </View>
          <Chip 
            style={[styles.stockChip, { backgroundColor: (item.sale_type === 'weight' ? item.stock_in_units : item.stock) > item.min_stock ? '#4CAF50' : '#FF9800' }]}
            textStyle={{ color: 'white' }}
          >
            Stock: {item.sale_type === 'weight' ? `${item.stock_in_units}${item.unit_of_measure || 'kg'}` : item.stock}
          </Chip>
        </View>
        {item.category_name && (
          <Paragraph style={styles.productCategory}>Categoría: {item.category_name}</Paragraph>
        )}
        {item.supplier_name && (
          <Paragraph style={styles.productSupplier}>Proveedor: {item.supplier_name}</Paragraph>
        )}
        <View style={styles.productActions}>
          <Button
            mode="contained"
            onPress={() => handleAddToCart(item)}
            style={[styles.addToCartButton, (item.sale_type === 'weight' ? item.stock_in_units <= 0 : item.stock <= 0) && styles.disabledButton]}
            icon="cart-plus"
            disabled={item.sale_type === 'weight' ? item.stock_in_units <= 0 : item.stock <= 0}
          >
            {(item.sale_type === 'weight' ? item.stock_in_units <= 0 : item.stock <= 0) ? 'Sin Stock' : 'Agregar al Carrito'}
          </Button>
        </View>
      </Card.Content>
    </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar productos..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={openScanner}
            style={styles.scannerButton}
            icon="qrcode-scan"
          >
            Escanear
          </Button>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>No hay productos</Title>
              <Paragraph>Agrega productos para comenzar</Paragraph>
            </Card.Content>
          </Card>
        }
      />


      {/* Modal del escáner */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={closeScanner}
        />
      </Modal>

      {/* Modal para ingresar peso de productos a granel */}
      <Modal
        visible={showWeightModal}
        onDismiss={() => setShowWeightModal(false)}
        contentContainerStyle={styles.weightModalContainer}
      >
        <Card style={styles.weightModalCard}>
          <Card.Content>
            <Title style={styles.weightModalTitle}>
              ⚖️ Producto a Granel
            </Title>
            <Paragraph style={styles.weightModalSubtitle}>
              {selectedProduct?.name}
            </Paragraph>
            <Paragraph style={styles.weightModalInfo}>
              Precio: ${selectedProduct?.price_per_unit || 0}/{selectedProduct?.unit_of_measure || 'kg'}
            </Paragraph>
            <Paragraph style={styles.weightModalInfo}>
              Stock disponible: {selectedProduct?.stock_in_units || 0}{selectedProduct?.unit_of_measure || 'kg'}
            </Paragraph>
            
            <TextInput
              label={`Peso en ${selectedProduct?.unit_of_measure || 'kg'}`}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              style={styles.weightInput}
              placeholder="0.0"
            />
            
            <View style={styles.weightModalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowWeightModal(false)}
                style={styles.weightModalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleAddWeight}
                style={[styles.weightModalButton, styles.addWeightButton]}
              >
                Agregar al Carrito
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  searchContainer: {
    padding: 8,
    backgroundColor: '#fff',
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    elevation: 0,
    flex: 1,
    marginRight: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  scannerButton: {
    elevation: 0,
    flex: 1,
    maxWidth: 200,
  },
  listContainer: {
    padding: 10,
  },
  productCard: {
    marginBottom: 10,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productText: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  productActions: {
    marginTop: 12,
    alignItems: 'center',
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  stockChip: {
    marginLeft: 10,
  },
  productCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productSupplier: {
    fontSize: 12,
    color: '#666',
  },
  emptyCard: {
    marginTop: 50,
    elevation: 2,
  },
  // Estilos para modal de peso
  weightModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  weightModalCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  weightModalTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#ff9800',
  },
  weightModalSubtitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  weightModalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  weightInput: {
    marginVertical: 15,
  },
  weightModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  weightModalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  addWeightButton: {
    backgroundColor: '#ff9800',
  },
});

export default ProductsScreen;

