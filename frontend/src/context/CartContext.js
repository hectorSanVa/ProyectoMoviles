import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Cargar carrito al iniciar
  useEffect(() => {
    loadCart();
  }, []);

  // Guardar carrito cuando cambie (excepto cuando está vacío por clearCart)
  useEffect(() => {
    console.log('🔄 useEffect saveCart: Carrito cambió, productos:', cart.length);
    if (cart.length > 0) {
      console.log('💾 Guardando carrito porque tiene productos...');
      saveCart();
    } else {
      console.log('💾 No guardando carrito porque está vacío');
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      console.log('🛒 Cargando carrito desde AsyncStorage...');
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('🛒 Carrito encontrado en AsyncStorage:', parsedCart.length, 'productos');
        setCart(parsedCart);
        console.log('🛒 Carrito cargado desde AsyncStorage:', parsedCart.length, 'productos');
      } else {
        console.log('🛒 No hay carrito guardado en AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error cargando carrito:', error);
    }
  };

  const saveCart = async () => {
    try {
      console.log('💾 Guardando carrito en AsyncStorage...');
      console.log('💾 Carrito a guardar:', cart.length, 'productos');
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      console.log('💾 Carrito guardado en AsyncStorage:', cart.length, 'productos');
    } catch (error) {
      console.error('❌ Error guardando carrito:', error);
    }
  };

  const addToCart = (product, customQuantity = null, onShowWeightModal = null) => {
    // Determinar si es producto a granel
    const isBulkProduct = product.sale_type === 'weight';
    
    if (isBulkProduct) {
      // Para productos a granel, necesitamos que el usuario especifique el peso
      if (customQuantity === null) {
        // Mostrar modal para ingresar peso
        if (onShowWeightModal) {
          onShowWeightModal(product);
        } else {
          Alert.alert(
            'Producto a Granel',
            `"${product.name}" se vende por peso. Use el botón "Agregar Peso" para especificar la cantidad.`,
            [{ text: 'OK' }]
          );
        }
        return false;
      } else {
        return addBulkProductToCart(product, customQuantity);
      }
    } else {
      // Producto por unidad (lógica original)
      if (product.stock <= 0) {
        Alert.alert('Sin Stock', `El producto "${product.name}" no tiene stock disponible`);
        return false;
      }

      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          Alert.alert('Stock Insuficiente', `Solo hay ${product.stock} unidades disponibles de "${product.name}"`);
          return false;
        }
        
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, {
          id: product.id,
          name: product.name,
          code: product.code,
          price: parseFloat(product.sale_price),
          quantity: 1,
          image_url: product.image_url,
          stock: product.stock,
          sale_type: product.sale_type
        }]);
      }
      return true;
    }
  };

  const addBulkProductToCart = (product, weight) => {
    // Validar stock en peso disponible
    const availableWeight = parseFloat(product.stock_in_units || 0);
    if (availableWeight <= 0) {
      Alert.alert('Sin Stock', `El producto "${product.name}" no tiene stock disponible`);
      return false;
    }

    if (weight > availableWeight) {
      Alert.alert('Stock Insuficiente', `Solo hay ${availableWeight}${product.unit_of_measure || 'kg'} disponibles de "${product.name}"`);
      return false;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      // Para productos a granel, sumamos el peso
      const newTotalWeight = existingItem.weight + weight;
      if (newTotalWeight > availableWeight) {
        Alert.alert('Stock Insuficiente', `Solo hay ${availableWeight}${product.unit_of_measure || 'kg'} disponibles de "${product.name}"`);
        return false;
      }
      
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, weight: newTotalWeight, price: calculateBulkPrice(product, newTotalWeight) }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: calculateBulkPrice(product, weight),
        weight: weight,
        quantity: 1, // Para compatibilidad
        image_url: product.image_url,
        stock: product.stock_in_units,
        sale_type: product.sale_type,
        unit_of_measure: product.unit_of_measure
      }]);
    }
    return true;
  };

  const calculateBulkPrice = (product, weight) => {
    const pricePerUnit = parseFloat(product.price_per_unit || 0);
    return pricePerUnit * weight;
  };

  const updateQuantity = (productId, newQuantity) => {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return false;

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      // Para productos a granel, newQuantity es el peso
      if (cartItem.sale_type === 'weight') {
        if (newQuantity > cartItem.stock) {
          Alert.alert('Stock Insuficiente', `Solo hay ${cartItem.stock}${cartItem.unit_of_measure || 'kg'} disponibles de "${cartItem.name}"`);
          return false;
        }
        
        setCart(cart.map(item => 
          item.id === productId 
            ? { 
                ...item, 
                weight: newQuantity,
                price: calculateBulkPrice({ price_per_unit: item.price / item.weight }, newQuantity)
              }
            : item
        ));
      } else {
        // Producto por unidad (lógica original)
        if (newQuantity > cartItem.stock) {
          Alert.alert('Stock Insuficiente', `Solo hay ${cartItem.stock} unidades disponibles de "${cartItem.name}"`);
          return false;
        }
        
        setCart(cart.map(item => 
          item.id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
    }
    return true;
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = async () => {
    try {
      console.log('🗑️ Iniciando limpieza del carrito...');
      console.log('🗑️ Carrito actual antes de limpiar:', cart.length, 'productos');
      
      // Primero limpiar AsyncStorage
      await AsyncStorage.removeItem('cart');
      console.log('🗑️ Carrito limpiado de AsyncStorage');
      
      // Luego limpiar el estado
      setCart([]);
      console.log('🗑️ Carrito limpiado del estado');
      
      // Verificar que se limpió correctamente
      setTimeout(() => {
        console.log('🗑️ Verificación: Carrito después de limpiar:', cart.length, 'productos');
      }, 100);
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
      // Si hay error, al menos limpiar el estado
      setCart([]);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      if (item.sale_type === 'weight') {
        // Para productos a granel, el precio ya está calculado
        return sum + item.price;
      } else {
        // Para productos por unidad
        return sum + (item.price * item.quantity);
      }
    }, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const updateProductStock = (productId, newStock, newStockInUnits) => {
    console.log(`🔄 Actualizando stock para producto ${productId}: stock=${newStock}, stock_in_units=${newStockInUnits}`);
    console.log(`🔄 Carrito actual antes de actualizar:`, cart.length, 'productos');
    
    // Solo actualizar si el producto está en el carrito
    const productInCart = cart.find(item => item.id === productId);
    if (productInCart) {
      console.log(`🔄 Producto ${productId} encontrado en carrito, actualizando stock...`);
      setCart(cart.map(item => 
        item.id === productId 
          ? { 
              ...item, 
              stock: newStock,
              stock_in_units: newStockInUnits
            }
          : item
      ));
    } else {
      console.log(`🔄 Producto ${productId} NO está en carrito, no se actualiza`);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemsCount,
      updateProductStock
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
