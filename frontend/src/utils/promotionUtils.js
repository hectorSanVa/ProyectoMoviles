/**
 * Utilidades para manejo de ofertas y descuentos
 */

/**
 * Verifica si un producto está actualmente en oferta basándose en las fechas
 * @param {Object} product - Producto a verificar
 * @returns {boolean} - True si el producto está en oferta
 */
export const isProductOnSale = (product) => {
  if (!product) return false;
  
  // Si no tiene campos de oferta, retornar false
  if (!product.offer_start_date && !product.offer_end_date && !product.discount_percentage) {
    return false;
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // Si tiene fecha de inicio, verificar que la fecha actual sea mayor o igual
  if (product.offer_start_date) {
    const startDate = new Date(product.offer_start_date);
    startDate.setHours(0, 0, 0, 0);
    if (now < startDate) {
      return false;
    }
  }
  
  // Si tiene fecha de fin, verificar que la fecha actual sea menor o igual
  if (product.offer_end_date) {
    const endDate = new Date(product.offer_end_date);
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) {
      return false;
    }
  }
  
  // Verificar que tenga descuento
  const discount = parseFloat(product.discount_percentage) || 0;
  if (discount <= 0) {
    return false;
  }
  
  return true;
};

/**
 * Calcula el precio con descuento aplicado
 * @param {number} originalPrice - Precio original
 * @param {number} discountPercentage - Porcentaje de descuento
 * @returns {number} - Precio con descuento
 */
export const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  if (!originalPrice || !discountPercentage) return originalPrice;
  
  const price = parseFloat(originalPrice);
  const discount = parseFloat(discountPercentage);
  
  if (isNaN(price) || isNaN(discount) || discount <= 0) return price;
  
  const discountAmount = price * (discount / 100);
  const finalPrice = price - discountAmount;
  
  return Math.max(0, finalPrice); // Asegurar que no sea negativo
};

/**
 * Obtiene el precio final de un producto (con o sin descuento)
 * @param {Object} product - Producto
 * @returns {number} - Precio final
 */
export const getFinalPrice = (product) => {
  if (!product) return 0;
  
  // Obtener precio base según el tipo de venta
  let basePrice = 0;
  
  if (product.sale_type === 'weight') {
    basePrice = parseFloat(product.price_per_unit) || 0;
  } else {
    basePrice = parseFloat(product.sale_price) || parseFloat(product.price) || 0;
  }
  
  // Si está en oferta, aplicar descuento
  if (isProductOnSale(product)) {
    const discount = parseFloat(product.discount_percentage) || 0;
    return calculateDiscountedPrice(basePrice, discount);
  }
  
  return basePrice;
};

/**
 * Obtiene el badge de descuento para mostrar
 * @param {Object} product - Producto
 * @returns {string|null} - Badge de descuento o null
 */
export const getDiscountBadge = (product) => {
  if (!isProductOnSale(product)) return null;
  
  const discount = parseFloat(product.discount_percentage) || 0;
  if (discount <= 0) return null;
  
  return `-${discount}%`;
};

/**
 * Calcula cuántos días quedan para que termine la oferta
 * @param {string} endDate - Fecha de fin de oferta (YYYY-MM-DD)
 * @returns {number|null} - Días restantes o null
 */
export const getDaysUntilOfferEnds = (endDate) => {
  if (!endDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Filtra productos que están actualmente en oferta
 * @param {Array} products - Lista de productos
 * @returns {Array} - Productos en oferta
 */
export const filterProductsOnSale = (products) => {
  if (!Array.isArray(products)) return [];
  return products.filter(isProductOnSale);
};

