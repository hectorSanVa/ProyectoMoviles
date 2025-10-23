import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, TextInput, Chip, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { receiptService } from '../services/receiptService';
import { useCart } from '../context/CartContext';
import BarcodeScanner from '../components/BarcodeScanner';
import RealBarcodeScanner from '../components/RealBarcodeScanner';

const SalesScreen = ({ navigation }) => {
  const { cart, addToCart, updateQuantity, clearCart, getCartTotal, updateProductStock } = useCart();
  const [showScanner, setShowScanner] = useState(false);
  const [useRealScanner, setUseRealScanner] = useState(true); // Usar escáner real por defecto
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [products, setProducts] = useState([]);

  // Cargar productos al iniciar
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      if (response.success) {
        setProducts(response.data);
        
        // Actualizar stock en el carrito con los datos más recientes
        console.log('🔄 Refrescando productos después de venta...');
        response.data.forEach(product => {
          console.log(`📦 Producto ${product.name}: stock=${product.stock}, stock_in_units=${product.stock_in_units}`);
          updateProductStock(product.id, product.stock, product.stock_in_units);
        });
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  // Calcular totales con IVA
  const subtotal = getCartTotal();
  const taxRate = 0.16; // 16% IVA México
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const change = paymentMethod === 'efectivo' && cashReceived ? 
    parseFloat(cashReceived) - total : 0;

  const handleBarcodeScanned = async (barcode) => {
    try {
      const response = await productService.getByCode(barcode);
      if (response.success && response.data) {
        const success = addToCart(response.data, null, handleShowWeightModal);
        if (success) {
          Alert.alert('Producto Agregado', `${response.data.name} se ha añadido al carrito.`);
        }
      } else {
        Alert.alert('Producto no encontrado', `No se encontró producto con código: ${barcode}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
    setShowScanner(false);
  };

  const handleRealBarcodeScanned = async (barcode) => {
    console.log('🔍 Código real escaneado:', barcode);
    try {
      const response = await productService.getByCode(barcode);
      if (response.success && response.data) {
        const success = addToCart(response.data, null, handleShowWeightModal);
        if (success) {
          Alert.alert('Producto Agregado', `${response.data.name} se ha añadido al carrito.`);
        }
      } else {
        Alert.alert('Producto no encontrado', `No se encontró producto con código: ${barcode}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
    setShowScanner(false);
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

  // La función addToCart ahora viene del context

  // La función updateQuantity ahora viene del context

  const searchProducts = async () => {
    try {
      const response = await productService.getAll({ search: searchQuery });
      if (response.success) {
        setSearchResults(response.data);
        setShowSearch(true);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron buscar productos');
    }
  };

  const processSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }

    // Validar pago en efectivo
    if (paymentMethod === 'efectivo') {
      if (!cashReceived || parseFloat(cashReceived) < total) {
        Alert.alert('Error', 'El efectivo recibido debe ser mayor o igual al total');
        return;
      }
    }

    try {
      const saleData = {
        customer_name: customerName || 'Cliente general',
        payment_method: paymentMethod,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total: total,
        cash_received: paymentMethod === 'efectivo' ? parseFloat(cashReceived) : null,
        change: paymentMethod === 'efectivo' ? change : null,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.sale_type === 'weight' ? item.weight : item.quantity,
          price: item.sale_type === 'weight' ? item.price / item.weight : item.price, // Precio unitario
          weight: item.sale_type === 'weight' ? item.weight : null,
          unit_of_measure: item.sale_type === 'weight' ? item.unit_of_measure : null
        }))
      };

      const response = await salesService.create(saleData);
      if (response.success) {
        // Generar comprobante
        const receiptData = {
          ...response.data,
          items: cart.map(item => ({
            product_name: item.name,
            quantity: item.sale_type === 'weight' ? item.weight : item.quantity,
            unit_price: item.sale_type === 'weight' ? item.price / item.weight : item.price,
            weight: item.sale_type === 'weight' ? item.weight : null,
            unit_of_measure: item.sale_type === 'weight' ? item.unit_of_measure : null,
            sale_type: item.sale_type
          }))
        };
        
        const receiptResult = await receiptService.generateReceipt(receiptData);
        
        if (receiptResult.success) {
          Alert.alert(
            'Venta exitosa', 
            `Total: $${total.toFixed(2)}\n\nComprobante generado: ${receiptResult.fileName}`,
            [
              { text: 'Ver Comprobante', onPress: () => {
                Alert.alert('Comprobante de Venta', receiptResult.receiptText, [
                  { text: 'OK', onPress: async () => {
                    await clearCart();
                    setCustomerName('');
                    setCashReceived('');
                    setShowPaymentModal(false);
                    // No llamar loadProducts aquí porque ya se limpió el carrito
                  }}
                ]);
              }},
              { text: 'OK', onPress: async () => {
                await clearCart();
                setCustomerName('');
                setCashReceived('');
                setShowPaymentModal(false);
                // No llamar loadProducts aquí porque ya se limpió el carrito
              }}
            ]
          );
        } else {
          Alert.alert('Venta exitosa', `Total: $${total.toFixed(2)}\n\nError generando comprobante`);
          await clearCart();
          setCustomerName('');
          setCashReceived('');
          setShowPaymentModal(false);
          // No llamar loadProducts aquí porque ya se limpió el carrito
        }
      } else {
        Alert.alert('Error', 'No se pudo procesar la venta');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al procesar la venta');
    }
  };

  const renderCartItem = ({ item }) => {
    const isBulkProduct = item.sale_type === 'weight';
    const displayQuantity = isBulkProduct ? item.weight : item.quantity;
    const unitLabel = isBulkProduct ? item.unit_of_measure || 'kg' : 'unidades';
    const unitPrice = isBulkProduct ? item.price / item.weight : item.price;
    
    return (
      <Card style={styles.cartItem}>
        <Card.Content>
          {/* Header con imagen, nombre y botón eliminar */}
          <View style={styles.cartItemHeader}>
            <View style={styles.cartItemInfo}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, styles.noImagePlaceholder]}>
                  <MaterialIcons name="image" size={24} color="#ccc" />
                </View>
              )}
              <View style={styles.cartItemText}>
                <Title style={styles.cartItemName} numberOfLines={2}>{item.name}</Title>
                <Paragraph style={styles.cartItemCode}>Código: {item.code}</Paragraph>
                {isBulkProduct && (
                  <Paragraph style={styles.bulkInfo}>
                    ⚖️ ${unitPrice.toFixed(2)} por {unitLabel}
                  </Paragraph>
                )}
              </View>
            </View>
            <Button
              mode="text"
              onPress={() => removeFromCart(item.id)}
              style={styles.removeButton}
              icon="close"
              textColor="#f44336"
            >
              Eliminar
            </Button>
          </View>

          {/* Controles de cantidad */}
          <View style={styles.cartItemControls}>
            <View style={styles.quantitySection}>
              <Paragraph style={styles.quantityLabel}>Cantidad:</Paragraph>
              <View style={styles.quantityControls}>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    if (isBulkProduct) {
                      const newWeight = Math.max(0, item.weight - 0.1);
                      updateQuantity(item.id, newWeight);
                    } else {
                      updateQuantity(item.id, item.quantity - 1);
                    }
                  }}
                  style={styles.quantityButton}
                  compact
                >
                  -
                </Button>
                <View style={styles.quantityInputContainer}>
                  <TextInput
                    value={displayQuantity.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      updateQuantity(item.id, value);
                    }}
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    placeholder={isBulkProduct ? "0.0" : "0"}
                  />
                  <Paragraph style={styles.unitLabel}>{unitLabel}</Paragraph>
                </View>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    if (isBulkProduct) {
                      const newWeight = item.weight + 0.1;
                      updateQuantity(item.id, newWeight);
                    } else {
                      updateQuantity(item.id, item.quantity + 1);
                    }
                  }}
                  style={styles.quantityButton}
                  compact
                >
                  +
                </Button>
              </View>
            </View>

            {/* Precio total del item */}
            <View style={styles.priceSection}>
              <Paragraph style={styles.priceLabel}>Total:</Paragraph>
              <Title style={styles.itemTotal}>
                ${item.price.toFixed(2)}
              </Title>
              {isBulkProduct && (
                <Paragraph style={styles.bulkCalculation}>
                  {item.weight.toFixed(2)} {unitLabel} × ${unitPrice.toFixed(2)}
                </Paragraph>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <TextInput
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          mode="outlined"
        />
        <Button 
          mode="contained" 
          onPress={searchProducts}
          style={styles.searchButton}
          icon="magnify"
        >
          Buscar
        </Button>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Scanner')}
          style={styles.scannerButton}
          icon="qrcode-scan"
        >
          Escáner Dedicado
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => setShowScanner(true)}
          style={styles.toggleButton}
          icon="camera-alt"
        >
          Escáner Rápido
        </Button>
      </View>

      {/* Carrito de compras */}
      <View style={styles.cartSection}>
        <Title style={styles.sectionTitle}>Carrito de Compras</Title>
        {cart.length === 0 ? (
          <Card style={styles.emptyCart}>
            <Card.Content>
              <Paragraph style={styles.emptyCartText}>
                El carrito está vacío
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.cartList}
          />
        )}
      </View>

      {/* Totales y pago */}
      {cart.length > 0 && (
        <Card style={[styles.totalsCard, styles.paymentSection]}>
          <Card.Content>
            <View style={styles.totalsRow}>
              <Paragraph>Subtotal:</Paragraph>
              <Paragraph>${subtotal.toFixed(2)}</Paragraph>
            </View>
            <View style={styles.totalsRow}>
              <Paragraph>IVA (16%):</Paragraph>
              <Paragraph>${taxAmount.toFixed(2)}</Paragraph>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.totalsRow}>
              <Title>Total:</Title>
              <Title>${total.toFixed(2)}</Title>
            </View>
            
            <TextInput
              label="Nombre del cliente"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.customerInput}
              mode="outlined"
            />
            
            <View style={styles.paymentMethods}>
              <Button 
                mode={paymentMethod === 'efectivo' ? 'contained' : 'outlined'}
                onPress={() => setPaymentMethod('efectivo')}
                style={styles.paymentButton}
              >
                Efectivo
              </Button>
              <Button 
                mode={paymentMethod === 'tarjeta' ? 'contained' : 'outlined'}
                onPress={() => setPaymentMethod('tarjeta')}
                style={styles.paymentButton}
              >
                Tarjeta
              </Button>
            </View>
            
            {paymentMethod === 'efectivo' && (
              <TextInput
                label="Efectivo recibido"
                value={cashReceived}
                onChangeText={setCashReceived}
                keyboardType="numeric"
                style={styles.cashInput}
                mode="outlined"
              />
            )}
            
            {paymentMethod === 'efectivo' && cashReceived && change > 0 && (
              <View style={styles.changeRow}>
                <Paragraph>Cambio:</Paragraph>
                <Paragraph style={styles.changeAmount}>${change.toFixed(2)}</Paragraph>
              </View>
            )}
            
            <Button 
              mode="contained" 
              onPress={processSale}
              style={styles.processButton}
              icon="check"
            >
              Procesar Venta
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Modal del escáner */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        {useRealScanner ? (
          <RealBarcodeScanner 
            onScan={handleRealBarcodeScanned}
            onClose={() => setShowScanner(false)}
          />
        ) : (
          <BarcodeScanner 
            onScan={handleBarcodeScanned}
            onClose={() => setShowScanner(false)}
          />
        )}
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
              💰 Precio: ${selectedProduct?.price_per_unit || 0} por {selectedProduct?.unit_of_measure || 'kg'}
            </Paragraph>
            <Paragraph style={styles.weightModalInfo}>
              📦 Stock disponible: {selectedProduct?.stock_in_units || 0} {selectedProduct?.unit_of_measure || 'kg'}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    elevation: 1,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    marginRight: 5,
  },
  scannerButton: {
    marginLeft: 5,
    flex: 1,
  },
  toggleButton: {
    marginLeft: 5,
    minWidth: 60,
  },
  cartSection: {
    flex: 1,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: '#fff',
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  cartItemInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cartItemText: {
    flex: 1,
    marginLeft: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    lineHeight: 16,
    color: '#333',
  },
  cartItemCode: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  removeButton: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  priceChip: {
    backgroundColor: '#4CAF50',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 4,
  },
  quantitySection: {
    flex: 1,
    marginRight: 8,
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    color: '#666',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  priceSection: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 3,
    elevation: 0,
  },
  quantityContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantityInput: {
    width: 45,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 3,
    color: '#333',
  },
  unitLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 1,
  },
  bulkCalculation: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyCart: {
    marginTop: 20,
    elevation: 1,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  totalsCard: {
    margin: 2,
    elevation: 1,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1,
  },
  divider: {
    marginVertical: 1,
  },
  customerInput: {
    marginVertical: 1,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 1,
  },
  paymentButton: {
    flex: 1,
    marginHorizontal: 2,
    height: 36, // Altura reducida
  },
  processButton: {
    marginTop: 1,
    backgroundColor: '#4CAF50',
    height: 40, // Altura reducida
  },
  cashInput: {
    marginTop: 1,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1,
    padding: 4,
    backgroundColor: '#e8f5e8',
    borderRadius: 3,
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  // Estilos para evitar que el teclado oculte la sección de pago
  paymentSection: {
    flexShrink: 0, // Evitar que se comprima
    minHeight: 150, // Altura mínima reducida para ocupar menos espacio
  },
  // Estilos para productos a granel
  bulkInfo: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: 'bold',
    marginTop: 2,
    fontStyle: 'italic',
  },
  bulkDetails: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  bulkCalculation: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: 'bold',
    textAlign: 'center',
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

export default SalesScreen;

