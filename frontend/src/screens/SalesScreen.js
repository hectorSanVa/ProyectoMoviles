import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, Modal, Image, KeyboardAvoidingView, Platform, AppState, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, TextInput, Chip, Divider, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { receiptService } from '../services/receiptService';
import { discountService } from '../services/discountService';
import { offlineSyncService } from '../services/offlineSyncService';
import { offlineStorageService } from '../services/offlineStorageService';
import { voiceSearchService } from '../services/voiceSearchService';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import QRCodeScanner from '../components/QRCodeScanner';
import CashierAssistant from '../components/CashierAssistant';

const SalesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth(); // Obtener el usuario actual
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, getCartTotal, updateProductStock } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [products, setProducts] = useState([]);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [wasCartCleared, setWasCartCleared] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [todayStats, setTodayStats] = useState(null);

  // Cargar productos al iniciar
  useEffect(() => {
    loadProducts();
    checkConnection();
    loadPendingSalesCount();
    
    // Limpiar locks antiguos al iniciar
    AsyncStorage.getItem('sync_lock').then(lock => {
      if (lock) {
        try {
          const lockData = JSON.parse(lock);
          if (lockData.timestamp && (Date.now() - lockData.timestamp > 30000)) {
            // Si el lock tiene más de 30 segundos, liberarlo
            AsyncStorage.removeItem('sync_lock');
            console.log('🗑️ Limpiando lock antiguo al iniciar');
          }
        } catch (e) {
          // Si el lock no es válido JSON, eliminarlo
          AsyncStorage.removeItem('sync_lock');
          console.log('🗑️ Eliminando lock inválido al iniciar');
        }
      }
    });
    
    // Verificar conexión periódicamente
    const interval = setInterval(() => {
      checkConnection();
      loadPendingSalesCount();
    }, 10000); // Cada 10 segundos

    // Sincronizar cuando la app vuelve al foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkConnection();
        loadPendingSalesCount();
        if (isOnline) {
          syncPendingSales();
        }
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isOnline]);

  // Resetear vista de pagos cuando el carrito esté vacío o cuando se agrega el primer producto después de limpiar
  useEffect(() => {
    if (cart.length === 0) {
      setShowPaymentDetails(false);
      setWasCartCleared(true);
    } else if (cart.length === 1 && wasCartCleared) {
      // Si se agrega el primer producto después de haber limpiado el carrito, resetear a vista simple
      setShowPaymentDetails(false);
      setWasCartCleared(false);
    }
  }, [cart.length, wasCartCleared]);

  const loadProducts = async () => {
    try {
      const online = await offlineSyncService.isOnline();
      
      if (online) {
        // Si hay conexión, cargar desde el servidor
        console.log('📡 Cargando productos desde servidor...');
        const response = await productService.getAll();
        if (response.success) {
            // Cargar descuentos activos
          try {
            console.log('🎫 Llamando a discountService.getActive()...');
            const discountsResponse = await discountService.getActive();
            console.log('🎫 Respuesta completa:', JSON.stringify(discountsResponse, null, 2));
            
            // Extraer el array de descuentos de la respuesta
            let discountsArray = [];
            if (Array.isArray(discountsResponse)) {
              discountsArray = discountsResponse;
              console.log('✅ Respuesta es un array directo');
            } else if (discountsResponse && discountsResponse.data && Array.isArray(discountsResponse.data)) {
              discountsArray = discountsResponse.data;
              console.log('✅ Respuesta tiene propiedad .data');
            } else if (discountsResponse && discountsResponse.discounts && Array.isArray(discountsResponse.discounts)) {
              discountsArray = discountsResponse.discounts;
              console.log('✅ Respuesta tiene propiedad .discounts');
            } else {
              console.log('❌ No se pudo extraer array de descuentos');
            }
            
            console.log('🎫 Descuentos activos procesados:', discountsArray.length);
            console.log('🎫 Descuentos:', JSON.stringify(discountsArray, null, 2));
            
            // Aplicar descuentos a los productos
            const productsWithDiscounts = response.data.map(product => {
              // Buscar si hay un descuento para este producto
              const productDiscount = discountsArray.find(
                discount => discount.discount_type === 'product' && 
                           discount.target_id === product.id
              );
              
              // Buscar si hay un descuento para la categoría
              const categoryDiscount = discountsArray.find(
                discount => discount.discount_type === 'category' && 
                           discount.target_id === product.category_id
              );
              
              // Buscar si hay un descuento global
              const globalDiscount = discountsArray.find(
                discount => discount.discount_type === 'global'
              );
              
              // Aplicar descuento (prioridad: producto > categoría > global)
              const activeDiscount = productDiscount || categoryDiscount || globalDiscount;
              
              if (activeDiscount) {
                const discountPercentage = parseFloat(activeDiscount.discount_percentage);
                
                // Calcular precio original según el tipo de producto
                let originalPrice;
                if (product.sale_type === 'weight') {
                  // Para productos a granel, usar price_per_unit
                  originalPrice = product.price_per_unit || 0;
                } else {
                  // Para productos por unidad, usar sale_price
                  originalPrice = product.sale_price || 0;
                }
                
                const discountAmount = (originalPrice * discountPercentage) / 100;
                const finalPrice = originalPrice - discountAmount;
                
                console.log(`🎫 Aplicando descuento del ${discountPercentage}% a ${product.name} (${product.sale_type})`);
                console.log(`   Precio original: $${originalPrice}, Precio final: $${finalPrice}`);
                
                return {
                  ...product,
                  discounted_price: finalPrice,
                  discount_percentage: discountPercentage,
                  has_discount: true,
                  original_price: originalPrice,
                  discount_type: activeDiscount.discount_type // Guardar el tipo de descuento aplicado
                };
              }
              
              return product;
            });
            
            setProducts(productsWithDiscounts);
            
            // Guardar en caché local para uso offline
            await offlineStorageService.cacheProducts(productsWithDiscounts);
            
            // Actualizar stock en el carrito con los datos más recientes
            console.log('🔄 Refrescando productos después de venta...');
            productsWithDiscounts.forEach(product => {
              console.log(`📦 Producto ${product.name}: stock=${product.stock}, stock_in_units=${product.stock_in_units}`);
              updateProductStock(product.id, product.stock, product.stock_in_units);
            });
          } catch (error) {
            console.error('Error cargando descuentos:', error);
            setProducts(response.data);
            await offlineStorageService.cacheProducts(response.data);
          }
        }
      } else {
        // Si no hay conexión, cargar desde caché local
        console.log('📦 Cargando productos desde caché local...');
        const cachedProducts = await offlineStorageService.getCachedProducts();
        
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          console.log(`✅ ${cachedProducts.length} productos cargados desde caché`);
        } else {
          Alert.alert(
            'Sin conexión',
            'No hay productos en caché. Por favor, conecta a internet al menos una vez para descargar el catálogo.'
          );
        }
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      
      // Intentar cargar desde caché en caso de error
      try {
        const cachedProducts = await offlineStorageService.getCachedProducts();
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          console.log('✅ Productos cargados desde caché (fallback)');
        }
      } catch (cacheError) {
        console.error('Error cargando productos desde caché:', cacheError);
      }
    }
  };

  // Calcular totales con IVA
  const subtotal = getCartTotal();
  const taxRate = 0.16; // 16% IVA México
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const change = paymentMethod === 'efectivo' && cashReceived ? 
    parseFloat(cashReceived) - total : 0;


  const handleShowWeightModal = (product) => {
    setSelectedProduct(product);
    setWeightInput('');
    setShowWeightModal(true);
  };

  const handleQRScan = async (code) => {
    try {
      const response = await productService.getByCode(code);
      if (response.success && response.data) {
        const product = response.data;
        // Si el producto es a granel, mostrar el modal para ingresar peso
        if (product.sale_type === 'weight') {
          handleShowWeightModal(product);
        } else {
          // Si es producto por unidad, agregarlo directamente
          const success = addToCart(product, null, handleShowWeightModal);
          if (success) {
            Alert.alert('Producto Agregado', `${product.name} se ha añadido al carrito.`);
          }
        }
      } else {
        Alert.alert('Producto no encontrado', `No se encontró producto con código: ${code}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo buscar el producto');
    }
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
      // Filtrar localmente
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearch(true);
      
      // Hablar el resultado
      if (filtered.length === 0) {
        voiceSearchService.speakProductFound(null, 0);
      } else if (filtered.length === 1) {
        voiceSearchService.speakProductFound(filtered[0], 1);
      } else {
        voiceSearchService.speakProductFound(null, filtered.length);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
      Alert.alert('Error', 'No se pudieron buscar productos');
      voiceSearchService.speakStatus('Error al buscar productos');
    }
  };

  const handlePayButton = () => {
    setShowPaymentDetails(true);
    
    // Hablar el total antes de confirmar la compra
    voiceSearchService.speakSaleTotal(total);
  };

  const handleAddMoreProducts = () => {
    setShowPaymentDetails(false);
  };

  // Funciones de sincronización offline
  const checkConnection = async () => {
    const online = await offlineSyncService.isOnline();
    setIsOnline(online);
    console.log(`📶 Estado de conexión: ${online ? 'En línea' : 'Sin conexión'}`);
  };

  const loadPendingSalesCount = async () => {
    try {
      const pendingSales = await offlineSyncService.getPendingSales();
      const unsyncedCount = pendingSales.filter(s => !s.synced).length;
      setPendingSalesCount(unsyncedCount);
    } catch (error) {
      console.error('Error cargando contador de ventas pendientes:', error);
    }
  };

  const syncPendingSales = async () => {
    try {
      console.log('🔄 Iniciando sincronización de ventas pendientes...');
      console.log(`📊 Hay ${pendingSalesCount} ventas pendientes`);
      
      const result = await offlineSyncService.syncPendingSales((progress) => {
        console.log(`🔄 Sincronizando... ${progress.synced}/${progress.total}`);
      });
      
      if (result.synced > 0) {
        console.log(`✅ ${result.synced} venta(s) sincronizada(s)`);
        Alert.alert('Sincronización exitosa', `${result.synced} venta(s) sincronizada(s)`);
        loadPendingSalesCount();
      } else if (result.failed > 0) {
        console.warn(`⚠️ ${result.failed} venta(s) no se pudieron sincronizar`);
        Alert.alert('Sincronización incompleta', `${result.synced} sincronizadas, ${result.failed} fallidas. Intentará de nuevo más tarde.`);
        loadPendingSalesCount();
      }
    } catch (error) {
      console.error('❌ Error sincronizando ventas pendientes:', error);
      Alert.alert('Error de sincronización', 'Las ventas se guardarán cuando haya conexión');
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
          product_name: item.name, // Agregar nombre para el comprobante
          quantity: item.sale_type === 'weight' ? item.weight : item.quantity,
          price: item.sale_type === 'weight' ? item.price / item.weight : item.price, // Precio unitario
          weight: item.sale_type === 'weight' ? item.weight : null,
          unit_of_measure: item.sale_type === 'weight' ? item.unit_of_measure : null,
          sale_type: item.sale_type || 'unit'
        }))
      };


      let saleResponse;
      let isOfflineSale = false;

      try {
        // Intentar crear venta en servidor
        saleResponse = await salesService.create(saleData);
        
        if (saleResponse.success) {
          console.log('✅ Venta procesada en línea');
        } else {
          throw new Error('Error en servidor');
        }
      } catch (error) {
        // Si falla, guardar localmente
        console.warn('⚠️ Sin conexión, guardando venta localmente...');
        console.log('📦 Datos de la venta a guardar:', JSON.stringify(saleData, null, 2));
        try {
          const offlineSale = await offlineSyncService.savePendingSale(saleData);
          console.log('✅ Venta offline guardada correctamente:', offlineSale.id);
          saleResponse = { success: true, data: offlineSale };
          isOfflineSale = true;
          setPendingSalesCount(prev => prev + 1);
        } catch (offlineError) {
          console.error('❌ ERROR CRÍTICO: No se pudo guardar la venta offline:', offlineError);
          Alert.alert('Error crítico', 'No se pudo guardar la venta. Por favor, revisa los logs.');
          return;
        }
      }

      if (saleResponse.success) {
        // Generar comprobante SOLO para ventas en línea
        const receiptData = isOfflineSale 
          ? null // No generar comprobante para ventas offline
          : {
              ...saleResponse.data,
              user_id: user.id,
              cashier_name: user.username,
              items: cart.map(item => ({
                product_name: item.name,
                quantity: item.sale_type === 'weight' ? item.weight : item.quantity,
                unit_price: item.sale_type === 'weight' ? item.price / item.weight : item.price,
                weight: item.sale_type === 'weight' ? item.weight : null,
                unit_of_measure: item.sale_type === 'weight' ? item.unit_of_measure : null,
                sale_type: item.sale_type
              }))
            };
        
        let receiptResult;
        
        // Generar comprobante SOLO para ventas en línea
        if (!isOfflineSale && receiptData) {
          try {
            receiptResult = await receiptService.generateReceipt(receiptData);
          } catch (receiptError) {
            console.warn('⚠️ No se pudo generar comprobante:', receiptError);
          }
        }

        const message = isOfflineSale 
          ? `Venta guardada localmente. Se sincronizará automáticamente cuando haya conexión.`
          : `Total: $${total.toFixed(2)}`;

        // Limpiar carrito de una vez (tanto para online como offline)
        await clearCart();
        setCustomerName('');
        setCashReceived('');
        setShowPaymentModal(false);
        setShowPaymentDetails(false);
        setWasCartCleared(false);
        
        // Si es venta offline y tiene comprobante, mostrarlo
        if (isOfflineSale && receiptResult?.success) {
          Alert.alert(
            'Venta guardada offline',
            `${message}\n\nComprobante generado: ${receiptResult.fileName}`,
            [
              { text: 'Ver Comprobante', onPress: () => {
                Alert.alert('Comprobante de Venta', receiptResult.receiptText, [{ text: 'OK' }]);
              }},
              { text: 'OK' }
            ]
          );
          return; // Salir temprano para ventas offline con comprobante
        } else if (isOfflineSale) {
          Alert.alert('Venta guardada offline', message);
          return; // Salir temprano para ventas offline sin comprobante
        } else if (receiptResult?.success) {
          // Hablar el cambio si hay (en pesos mexicanos)
          if (paymentMethod === 'efectivo' && change > 0) {
            const pesos = Math.floor(change);
            const centavos = Math.round((change - pesos) * 100);
            
            let text = `Cambio: ${pesos} pesos`;
            if (centavos > 0) {
              text += ` con ${centavos} centavos`;
            }
            
            voiceSearchService.speak(text, { rate: 0.85 });
          } else if (paymentMethod === 'efectivo' && change === 0) {
            voiceSearchService.speak('Pago exacto', { rate: 0.85 });
          }
          
          Alert.alert(
            'Venta exitosa', 
            `Total: $${total.toFixed(2)}\n\nComprobante generado: ${receiptResult.fileName}`,
            [
              { text: 'Ver Comprobante', onPress: () => {
                Alert.alert('Comprobante de Venta', receiptResult.receiptText, [{ text: 'OK' }]);
              }},
              { text: 'OK' }
            ]
          );
        } else if (receiptResult && !receiptResult.success) {
          Alert.alert('Venta exitosa', `Total: $${total.toFixed(2)}\n\nError generando comprobante`);
        }

        // Si estamos online y hay ventas pendientes, sincronizar
        if (isOnline && pendingSalesCount > 0) {
          syncPendingSales();
        }
      } else {
        Alert.alert('Error', 'No se pudo procesar la venta');
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      
      // Intentar guardar como venta offline si todavía no se guardó
      if (!error.message?.includes('offline')) {
        try {
          await offlineSyncService.savePendingSale(saleData);
          Alert.alert('Venta guardada offline', 'Se sincronizará cuando haya conexión');
          await clearCart();
          setCustomerName('');
          setCashReceived('');
          setShowPaymentModal(false);
          setShowPaymentDetails(false);
          setWasCartCleared(false);
        } catch (saveError) {
          Alert.alert('Error', 'Error al procesar la venta');
        }
      }
    }
  };

  const renderCartItem = ({ item }) => {
    const isBulkProduct = item.sale_type === 'weight';
    const displayQuantity = isBulkProduct ? item.weight : item.quantity;
    const unitLabel = isBulkProduct ? item.unit_of_measure || 'kg' : 'unidades';
    const unitPrice = isBulkProduct ? item.price / item.weight : item.price;
    
    return (
      <Card style={[styles.cartItem, { backgroundColor: theme.colors.surface }]}>
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
                <Title style={[styles.cartItemName, { color: theme.colors.onSurface }]} numberOfLines={2}>{item.name}</Title>
                <Paragraph style={[styles.cartItemCode, { color: theme.colors.onSurfaceVariant }]}>Código: {item.code}</Paragraph>
                {isBulkProduct && (
                  <Paragraph style={[styles.bulkInfo, { color: theme.colors.primary }]}>
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
              <Paragraph style={[styles.quantityLabel, { color: theme.colors.onSurfaceVariant }]}>Cantidad:</Paragraph>
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
                <View style={[styles.quantityInputContainer, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <TextInput
                    value={displayQuantity.toString()}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      updateQuantity(item.id, value);
                    }}
                    style={[styles.quantityInput, { color: theme.colors.onSurface }]}
                    keyboardType="numeric"
                    placeholder={isBulkProduct ? "0.0" : "0"}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  <Paragraph style={[styles.unitLabel, { color: theme.colors.onSurfaceVariant }]}>{unitLabel}</Paragraph>
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
              <Paragraph style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>Total:</Paragraph>
              <Title style={[styles.itemTotal, { color: theme.colors.tertiary }]}>
                ${item.price.toFixed(2)}
              </Title>
              {isBulkProduct && (
                <Paragraph style={[styles.bulkCalculation, { color: theme.colors.onSurfaceVariant }]}>
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
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header con búsqueda */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        {/* Indicador de conexión y ventas pendientes */}
        <View style={styles.connectionIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#f44336' }]} />
          <Paragraph style={{ color: theme.colors.onSurface, fontSize: 12 }}>
            {isOnline ? 'En línea' : 'Sin conexión'}
          </Paragraph>
          {pendingSalesCount > 0 && (
            <TouchableOpacity onPress={syncPendingSales} style={styles.syncButton}>
              <Badge style={[styles.pendingBadge, { backgroundColor: '#FF9800' }]}>
                {pendingSalesCount}
              </Badge>
              <Paragraph style={{ color: '#FF9800', fontSize: 10, marginLeft: 4 }}>
                Toca para sincronizar
              </Paragraph>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
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
        </View>
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
        <Card style={[styles.totalsCard, styles.paymentSection, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {!showPaymentDetails ? (
              // Vista simple: Solo total y botón Pagar
              <View style={styles.simplePaymentView}>
                <View style={styles.simpleTotalsRow}>
                  <Title style={{ color: theme.colors.onSurface, fontSize: 16 }}>Total a pagar:</Title>
                  <Title style={{ color: theme.colors.primary, fontSize: 20 }}>${total.toFixed(2)}</Title>
                </View>
                <Button
                  mode="contained"
                  onPress={handlePayButton}
                  style={styles.payButton}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  icon="credit-card"
                >
                  Pagar
                </Button>
              </View>
            ) : (
              // Vista completa: Desglose y campos de pago
              <View style={styles.fullPaymentView}>
                <View style={styles.totalsRow}>
                  <Paragraph style={{ color: theme.colors.onSurface }}>Subtotal:</Paragraph>
                  <Paragraph style={{ color: theme.colors.onSurface }}>${subtotal.toFixed(2)}</Paragraph>
                </View>
                <View style={styles.totalsRow}>
                  <Paragraph style={{ color: theme.colors.onSurface }}>IVA (16%):</Paragraph>
                  <Paragraph style={{ color: theme.colors.onSurface }}>${taxAmount.toFixed(2)}</Paragraph>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.totalsRow}>
                  <Title style={{ color: theme.colors.onSurface }}>Total:</Title>
                  <Title style={{ color: theme.colors.primary }}>${total.toFixed(2)}</Title>
                </View>
                
                <TextInput
                  label="Nombre del cliente"
                  value={customerName}
                  onChangeText={setCustomerName}
                  style={styles.customerInput}
                  mode="outlined"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
                />
                
                <View style={styles.paymentMethods}>
                  <Button 
                    mode={paymentMethod === 'efectivo' ? 'contained' : 'outlined'}
                    onPress={() => setPaymentMethod('efectivo')}
                    style={styles.paymentButton}
                    buttonColor={paymentMethod === 'efectivo' ? theme.colors.primary : undefined}
                    textColor={paymentMethod === 'efectivo' ? theme.colors.onPrimary : theme.colors.primary}
                    theme={{ colors: { outline: theme.colors.outline } }}
                  >
                    Efectivo
                  </Button>
                  <Button 
                    mode={paymentMethod === 'tarjeta' ? 'contained' : 'outlined'}
                    onPress={() => setPaymentMethod('tarjeta')}
                    style={styles.paymentButton}
                    buttonColor={paymentMethod === 'tarjeta' ? theme.colors.primary : undefined}
                    textColor={paymentMethod === 'tarjeta' ? theme.colors.onPrimary : theme.colors.primary}
                    theme={{ colors: { outline: theme.colors.outline } }}
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
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
                  />
                )}
                
                {paymentMethod === 'efectivo' && cashReceived && change > 0 && (
                  <View style={styles.changeRow}>
                    <Paragraph style={{ color: theme.colors.onSurface }}>Cambio:</Paragraph>
                    <Paragraph style={[styles.changeAmount, { color: theme.colors.primary }]}>${change.toFixed(2)}</Paragraph>
                  </View>
                )}
                
                <View style={styles.paymentActions}>
                  <Button 
                    mode="outlined" 
                    onPress={handleAddMoreProducts}
                    style={styles.addMoreButton}
                    textColor={theme.colors.secondary}
                    theme={{ colors: { outline: theme.colors.secondary } }}
                    icon={() => <MaterialIcons name="add-shopping-cart" size={20} color={theme.colors.primary} />}
                  >
                    Agregar más productos
                  </Button>
                  
                  <Button 
                    mode="contained" 
                    onPress={processSale}
                    style={styles.processButton}
                    buttonColor={theme.colors.tertiary}
                    textColor={theme.colors.onTertiary}
                    icon="check"
                  >
                    Procesar Venta
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
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

      {/* FAB para el escáner */}
      <FAB
        icon={() => <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />}
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: 80 }]}
        onPress={() => setShowScanner(true)}
      />


      {/* Modal del escáner QR */}
      {showScanner && (
        <QRCodeScanner
          visible={showScanner}
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Asistente para Cajero */}
      <CashierAssistant total={total} cart={cart} todayStats={todayStats} products={products} />

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
    padding: 8,
    backgroundColor: '#fff',
    elevation: 1,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pendingBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
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
  // Estilo específico para la vista simple
  simpleTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    alignItems: 'center',
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
  // Nuevos estilos para la vista de pagos mejorada
  simplePaymentView: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  fullPaymentView: {
    // Los estilos existentes se mantienen
  },
  payButton: {
    marginTop: 10,
    paddingHorizontal: 25,
    paddingVertical: 4,
    borderRadius: 15,
    minWidth: 100,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  addMoreButton: {
    flex: 1,
    marginRight: 5,
  },
  scannerButton: {
    flex: 1,
    marginLeft: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
  },
});

export default SalesScreen;

