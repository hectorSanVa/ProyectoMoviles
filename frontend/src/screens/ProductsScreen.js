import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl, Modal } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Searchbar, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import BarcodeScanner from '../components/BarcodeScanner';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll({ search: searchQuery });
      if (response.success) {
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

  const openScanner = () => {
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
  };

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <Card.Content>
        <View style={styles.productHeader}>
          <Title style={styles.productName}>{item.name}</Title>
          <Chip 
            style={[styles.stockChip, { backgroundColor: item.stock > item.min_stock ? '#4CAF50' : '#FF9800' }]}
            textStyle={{ color: 'white' }}
          >
            Stock: {item.stock}
          </Chip>
        </View>
        <Paragraph style={styles.productCode}>Código: {item.code}</Paragraph>
        <Paragraph style={styles.productPrice}>Precio: ${item.sale_price}</Paragraph>
        {item.category_name && (
          <Paragraph style={styles.productCategory}>Categoría: {item.category_name}</Paragraph>
        )}
        {item.supplier_name && (
          <Paragraph style={styles.productSupplier}>Proveedor: {item.supplier_name}</Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar productos..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        <Button
          mode="contained"
          onPress={openScanner}
          style={styles.scannerButton}
          icon="qrcode-scan"
        >
          Escanear
        </Button>
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

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Implementar agregar producto
        }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    elevation: 0,
    flex: 1,
    marginRight: 10,
  },
  scannerButton: {
    elevation: 0,
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
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

export default ProductsScreen;

