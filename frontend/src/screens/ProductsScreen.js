import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl, Modal, Image, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Searchbar, Chip, TextInput, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import { discountService } from '../services/discountService';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isProductOnSale, getFinalPrice, getDiscountBadge } from '../utils/promotionUtils';

const ProductsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { role } = useAuth(); // Para saber si es admin
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      // Cargar todos los productos
      const response = await productService.getAll();
      if (response.success) {
        console.log('🔄 ProductsScreen: Refrescando productos...');
        console.log('📦 Productos cargados:', response.data.length);
        
        // Cargar y aplicar descuentos
        try {
          const discountsResponse = await discountService.getActive();
          let discountsArray = [];
          if (Array.isArray(discountsResponse)) {
            discountsArray = discountsResponse;
          } else if (discountsResponse && discountsResponse.data) {
            discountsArray = discountsResponse.data;
          }
          
          console.log('🎫 Descuentos activos:', discountsArray.length);
          console.log('🎫 Lista de descuentos:', JSON.stringify(discountsArray, null, 2));
          
          // Aplicar descuentos a productos
          const productsWithDiscounts = response.data.map(product => {
            console.log(`🔍 Procesando producto: ${product.name} (ID: ${product.id}, Categoria ID: ${product.category_id})`);
            const productDiscount = discountsArray.find(
              discount => {
                const matches = discount.discount_type === 'product' && 
                              discount.target_id === product.id;
                if (matches) {
                  console.log(`✅ Descuento por producto encontrado para ${product.name}`);
                }
                return matches;
              }
            );
            
            const categoryDiscount = discountsArray.find(
              discount => {
                const matches = discount.discount_type === 'category' && 
                               discount.target_id === product.category_id;
                if (matches) {
                  console.log(`🎫 Descuento por categoría encontrado para ${product.name}:`, {
                    product_category_id: product.category_id,
                    discount_target_id: discount.target_id,
                    discount_percentage: discount.discount_percentage
                  });
                }
                return matches;
              }
            );
            
            const globalDiscount = discountsArray.find(
              discount => {
                if (discount.discount_type === 'global') {
                  console.log(`🎫 Descuento global encontrado para ${product.name}`);
                }
                return discount.discount_type === 'global';
              }
            );
            
            const activeDiscount = productDiscount || categoryDiscount || globalDiscount;
            
            if (activeDiscount) {
              const discountPercentage = parseFloat(activeDiscount.discount_percentage);
              let originalPrice;
              if (product.sale_type === 'weight') {
                originalPrice = product.price_per_unit || 0;
              } else {
                originalPrice = product.sale_price || 0;
              }
              
              const discountAmount = (originalPrice * discountPercentage) / 100;
              const finalPrice = originalPrice - discountAmount;
              
              return {
                ...product,
                discounted_price: finalPrice,
                discount_percentage: discountPercentage,
                has_discount: true,
                original_price: originalPrice,
                discount_type: activeDiscount.discount_type
              };
            }
            
            return product;
          });
          
          // Filtrar productos según búsqueda
          let filteredProducts = productsWithDiscounts;
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredProducts = productsWithDiscounts.filter(product => 
              product.name?.toLowerCase().includes(query) ||
              product.code?.toLowerCase().includes(query) ||
              product.category_name?.toLowerCase().includes(query)
            );
            console.log(`🔍 Filtrados ${filteredProducts.length} productos por: "${searchQuery}"`);
          }
          
          // Log detallado del stock de productos a granel
          filteredProducts.forEach(product => {
            if (product.sale_type === 'weight') {
              console.log(`📦 Producto a granel ${product.name}: stock_in_units=${product.stock_in_units}, stock=${product.stock}`);
            }
          });
          
          setProducts(filteredProducts);
        } catch (error) {
          console.error('Error cargando descuentos:', error);
          setProducts(response.data);
        }
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
  };
  
  // Recargar productos cuando cambie la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


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


  const renderProduct = ({ item }) => {
    console.log('Producto renderizado:', item.name, 'Image URL:', item.image_url);
    return (
      <Card style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.noImagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <MaterialIcons name="image" size={24} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.productText}>
                <View style={styles.productNameRow}>
                  <Title style={[styles.productName, { color: theme.colors.onSurface }]}>{item.name}</Title>
                  {isProductOnSale(item) && (
                    <Chip
                      style={[styles.discountChip, { backgroundColor: theme.colors.error }]}
                      textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                    >
                      {getDiscountBadge(item)}
                    </Chip>
                  )}
                </View>
                <Paragraph style={[styles.productCode, { color: theme.colors.onSurfaceVariant }]}>Código: {item.code}</Paragraph>
                <View style={styles.priceRow}>
                  {isProductOnSale(item) && (
                    <Paragraph style={[styles.originalPrice, { color: theme.colors.onSurfaceVariant }]}>
                      ${item.sale_type === 'weight' ? item.price_per_unit : item.sale_price}
                    </Paragraph>
                  )}
                  <Paragraph style={[styles.productPrice, { color: isProductOnSale(item) ? theme.colors.error : theme.colors.primary }]}>
                    Precio: ${item.sale_type === 'weight' 
                      ? `${getFinalPrice(item).toFixed(2)}/${item.unit_of_measure || 'kg'}` 
                      : getFinalPrice(item).toFixed(2)}
                  </Paragraph>
                </View>
              </View>
            </View>
          <Chip 
            style={[
              styles.stockChip, 
              { 
                backgroundColor: (item.sale_type === 'weight' ? item.stock_in_units : item.stock) > item.min_stock 
                  ? theme.colors.tertiary 
                  : theme.colors.warning 
              }
            ]}
            textStyle={{ color: theme.colors.onTertiary }}
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
            style={[
              styles.addToCartButton, 
              (item.sale_type === 'weight' ? item.stock_in_units <= 0 : item.stock <= 0) && styles.disabledButton
            ]}
            buttonColor={(item.sale_type === 'weight' ? item.stock_in_units <= 0 : item.stock <= 0) ? '#E53E3E' : theme.colors.tertiary}
            textColor={(item.sale_type === 'weight' ? item.stock_in_units <= 0 : item.stock <= 0) ? '#FFFFFF' : theme.colors.onTertiary}
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Buscar productos..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceContainer }]}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>No hay productos</Title>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Agrega productos para comenzar</Paragraph>
            </Card.Content>
          </Card>
        }
      />



      {/* FAB para admin: Crear producto */}
      {role === 'admin' && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('ProductManagement')}
          label="Nuevo"
        />
      )}

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
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  discountChip: {
    marginLeft: 8,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginRight: 8,
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
    // backgroundColor se maneja dinámicamente con buttonColor
    borderRadius: 8,
  },
  disabledButton: {
    // backgroundColor se maneja dinámicamente con buttonColor
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ProductsScreen;

