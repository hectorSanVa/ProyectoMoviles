import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, Modal, Image, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, TextInput, Chip, Divider, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';

const ProductManagementScreen = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    purchase_price: '',
    sale_price: '',
    stock: '',
    min_stock: '',
    category_id: '',
    supplier_id: '',
    sale_type: 'unit',
    unit_of_measure: 'kg',
    price_per_unit: '',
    stock_in_units: '',
    image: null
  });

  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos...');
      
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        supplierService.getAll()
      ]);
      
      console.log('📦 Productos:', productsRes);
      console.log('📂 Categorías:', categoriesRes);
      console.log('🏢 Proveedores:', suppliersRes);
      
      if (productsRes.success) {
        // Forzar actualización del estado
        const newProducts = [...productsRes.data];
        setProducts(newProducts);
        console.log('✅ Productos cargados:', newProducts.length);
        console.log('📦 Datos del producto:', newProducts[0]);
      } else {
        console.log('❌ Error cargando productos:', productsRes.message);
      }
      
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
        console.log('✅ Categorías cargadas:', categoriesRes.data.length);
      } else {
        console.log('❌ Error cargando categorías:', categoriesRes.message);
      }
      
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
        console.log('✅ Proveedores cargados:', suppliersRes.data.length);
      } else {
        console.log('❌ Error cargando proveedores:', suppliersRes.message);
      }
    } catch (error) {
      console.log('❌ Error cargando datos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validación básica
      if (!formData.name || !formData.code) {
        Alert.alert('Error', 'Nombre y código son requeridos');
        return;
      }

      // Validación específica según el tipo de producto
      if (formData.sale_type === 'weight') {
        // Para productos a granel, validar price_per_unit
        if (!formData.price_per_unit || parseFloat(formData.price_per_unit) <= 0) {
          Alert.alert('Error', 'Precio por unidad de peso es requerido para productos a granel');
          return;
        }
      } else {
        // Para productos por unidad, validar sale_price
        if (!formData.sale_price || parseFloat(formData.sale_price) <= 0) {
          Alert.alert('Error', 'Precio de venta es requerido');
          return;
        }
      }

      // Debug: Mostrar los valores del formData
      console.log('🔍 FormData completo antes de enviar:');
      console.log(JSON.stringify(formData, null, 2));
      console.log('🔍 Valores específicos:');
      console.log('  - sale_type:', formData.sale_type);
      console.log('  - unit_of_measure:', formData.unit_of_measure);
      console.log('  - price_per_unit:', formData.price_per_unit);
      console.log('  - stock_in_units:', formData.stock_in_units);
      console.log('  - sale_price:', formData.sale_price);
      console.log('  - stock:', formData.stock);

      const productData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price),
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        sale_type: formData.sale_type || 'unit',
        unit_of_measure: formData.unit_of_measure || 'kg',
        price_per_unit: parseFloat(formData.price_per_unit) || parseFloat(formData.sale_price),
        stock_in_units: parseFloat(formData.stock_in_units) || parseFloat(formData.stock) || 0
      };

      // Debug: Mostrar los valores del productData
      console.log('📤 ProductData completo que se enviará:');
      console.log(JSON.stringify(productData, null, 2));
      console.log('📤 Valores específicos:');
      console.log('  - sale_type:', productData.sale_type);
      console.log('  - unit_of_measure:', productData.unit_of_measure);
      console.log('  - price_per_unit:', productData.price_per_unit);
      console.log('  - stock_in_units:', productData.stock_in_units);

      let response;
      if (editingProduct) {
        response = await productService.update(editingProduct.id, productData);
      } else {
        response = await productService.create(productData);
      }

      if (response.success) {
        console.log('✅ Producto guardado exitosamente');
        Alert.alert('Éxito', 'Producto guardado exitosamente');
        setShowForm(false);
        setEditingProduct(null);
        resetForm();
        
        // Recargar datos después de un pequeño delay
        setTimeout(() => {
          console.log('🔄 Recargando datos después de guardar...');
          loadData();
        }, 1000);
      } else {
        console.log('❌ Error guardando producto:', response.message);
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.log('Error guardando producto:', error.message);
      Alert.alert('Error', 'No se pudo guardar el producto. Intenta nuevamente.');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      code: product.code || '',
      description: product.description || '',
      purchase_price: product.purchase_price?.toString() || '',
      sale_price: product.sale_price?.toString() || '',
      stock: product.stock?.toString() || '',
      min_stock: product.min_stock?.toString() || '',
      category_id: product.category_id?.toString() || '',
      supplier_id: product.supplier_id?.toString() || '',
      sale_type: product.sale_type || 'unit',
      unit_of_measure: product.unit_of_measure || 'kg',
      price_per_unit: product.price_per_unit?.toString() || '',
      stock_in_units: product.stock_in_units?.toString() || '',
      image: null
    });
    setSelectedImage(product.image_url ? { uri: product.image_url } : null);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await productService.delete(product.id);
              if (response.success) {
                Alert.alert('Éxito', 'Producto eliminado exitosamente');
                loadData();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      purchase_price: '',
      sale_price: '',
      stock: '',
      min_stock: '',
      category_id: '',
      supplier_id: '',
      sale_type: 'unit',
      unit_of_measure: 'kg',
      price_per_unit: '',
      stock_in_units: '',
      image: null
    });
    setSelectedImage(null);
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setFormData({ ...formData, image: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    console.log('🔍 Buscando categoría:', categoryId, 'Encontrada:', category);
    return category ? category.name : 'Sin categoría';
  };

  const getSupplierName = (supplierId) => {
    if (!supplierId) return 'Sin proveedor';
    const supplier = suppliers.find(sup => sup.id === parseInt(supplierId));
    console.log('🔍 Buscando proveedor:', supplierId, 'Encontrado:', supplier);
    return supplier ? supplier.name : 'Sin proveedor';
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Title style={styles.productName}>{item.name}</Title>
            <Paragraph style={styles.productCode}>Código: {item.code}</Paragraph>
            <Paragraph style={styles.productPrice}>Precio: ${item.sale_price}</Paragraph>
            <Paragraph style={styles.productStock}>Stock: {item.stock}</Paragraph>
            <Paragraph style={styles.productCategory}>
              Categoría: {item.category_name || 'Sin categoría'}
            </Paragraph>
            <Paragraph style={styles.productSupplier}>
              Proveedor: {item.supplier_name || 'Sin proveedor'}
            </Paragraph>
            <Paragraph style={styles.productSaleType}>
              Tipo: {item.sale_type === 'weight' ? 'A granel (peso)' : 'Por unidad'}
            </Paragraph>
            {item.sale_type === 'weight' && (
              <Paragraph style={styles.productBulkInfo}>
                Precio: ${item.price_per_unit || 0}/${item.unit_of_measure || 'kg'} | Stock: {item.stock_in_units || 0}{item.unit_of_measure || 'kg'}
              </Paragraph>
            )}
          </View>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          )}
        </View>
        <View style={styles.productActions}>
          <Button
            mode="outlined"
            onPress={() => handleEdit(item)}
            style={styles.actionButton}
          >
            Editar
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleDelete(item)}
            style={[styles.actionButton, styles.deleteButton]}
            textColor="#d32f2f"
          >
            Eliminar
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Gestión de Productos</Title>
        <Paragraph style={styles.headerSubtitle}>
          Administra tu inventario de productos
        </Paragraph>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.productsList}
        refreshing={loading}
        onRefresh={loadData}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowForm(true);
        }}
      />

      <Modal
        visible={showForm}
        onDismiss={() => {
          setShowForm(false);
          setEditingProduct(null);
          resetForm();
        }}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </Title>
            <IconButton
              icon="close"
              onPress={() => {
                setShowForm(false);
                setEditingProduct(null);
                resetForm();
              }}
            />
          </View>

          <View style={styles.form}>
            <View style={styles.input}>
              <TextInput
                label="Nombre del producto *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.textInput}
              />
            </View>

            <View style={styles.input}>
              <TextInput
                label="Código del producto *"
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text })}
                style={styles.textInput}
              />
            </View>

            <View style={styles.input}>
              <TextInput
                label="Descripción"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                style={styles.textInput}
                multiline
              />
            </View>

            {/* Sección de Tipo de Venta - MOVIDA AL PRINCIPIO */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>⚖️ Tipo de Venta</Title>
              
              <View style={styles.input}>
                <Paragraph style={styles.label}>¿Cómo se vende este producto?</Paragraph>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                  <Chip
                    selected={formData.sale_type === 'unit'}
                    onPress={() => setFormData({...formData, sale_type: 'unit'})}
                    style={styles.chip}
                  >
                    📦 Por unidad
                  </Chip>
                  <Chip
                    selected={formData.sale_type === 'weight'}
                    onPress={() => setFormData({...formData, sale_type: 'weight'})}
                    style={styles.chip}
                  >
                    ⚖️ A granel (peso)
                  </Chip>
                </ScrollView>
              </View>

              {formData.sale_type === 'weight' && (
                <View style={styles.input}>
                  <Paragraph style={styles.label}>Unidad de medida</Paragraph>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    <Chip
                      selected={formData.unit_of_measure === 'kg'}
                      onPress={() => setFormData({...formData, unit_of_measure: 'kg'})}
                      style={styles.chip}
                    >
                      Kilogramos (kg)
                    </Chip>
                    <Chip
                      selected={formData.unit_of_measure === 'g'}
                      onPress={() => setFormData({...formData, unit_of_measure: 'g'})}
                      style={styles.chip}
                    >
                      Gramos (g)
                    </Chip>
                    <Chip
                      selected={formData.unit_of_measure === 'lb'}
                      onPress={() => setFormData({...formData, unit_of_measure: 'lb'})}
                      style={styles.chip}
                    >
                      Libras (lb)
                    </Chip>
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Sección de Precios y Stock */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>💰 Precios y Stock</Title>
              
              {formData.sale_type === 'unit' ? (
                // Producto por unidad
                <>
                  <View style={styles.row}>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label="Precio de compra"
                        value={formData.purchase_price}
                        onChangeText={(text) => setFormData({ ...formData, purchase_price: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label="Precio de venta *"
                        value={formData.sale_price}
                        onChangeText={(text) => setFormData({ ...formData, sale_price: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label="Stock (unidades)"
                        value={formData.stock}
                        onChangeText={(text) => setFormData({ ...formData, stock: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label="Stock mínimo"
                        value={formData.min_stock}
                        onChangeText={(text) => setFormData({ ...formData, min_stock: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                  </View>
                </>
              ) : (
                // Producto a granel
                <>
                  <View style={styles.row}>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label="Precio de compra"
                        value={formData.purchase_price}
                        onChangeText={(text) => setFormData({ ...formData, purchase_price: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label={`Precio por ${formData.unit_of_measure} *`}
                        value={formData.price_per_unit}
                        onChangeText={(text) => setFormData({ ...formData, price_per_unit: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label={`Stock en ${formData.unit_of_measure}`}
                        value={formData.stock_in_units}
                        onChangeText={(text) => setFormData({ ...formData, stock_in_units: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={[styles.input, styles.halfInput]}>
                      <TextInput
                        label="Stock mínimo"
                        value={formData.min_stock}
                        onChangeText={(text) => setFormData({ ...formData, min_stock: text })}
                        keyboardType="numeric"
                        style={styles.textInput}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Sección de Clasificación */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>🏷️ Clasificación</Title>
              
              <View style={styles.input}>
                <Paragraph style={styles.label}>Categoría (opcional)</Paragraph>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                  <Chip
                    selected={!formData.category_id}
                    onPress={() => setFormData({...formData, category_id: ''})}
                    style={styles.chip}
                  >
                    Sin categoría
                  </Chip>
                  {categories.map(category => (
                    <Chip
                      key={category.id}
                      selected={formData.category_id === category.id.toString()}
                      onPress={() => setFormData({...formData, category_id: category.id.toString()})}
                      style={styles.chip}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.input}>
                <Paragraph style={styles.label}>Proveedor (opcional)</Paragraph>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                  <Chip
                    selected={!formData.supplier_id}
                    onPress={() => setFormData({...formData, supplier_id: ''})}
                    style={styles.chip}
                  >
                    Sin proveedor
                  </Chip>
                  {suppliers.map(supplier => (
                    <Chip
                      key={supplier.id}
                      selected={formData.supplier_id === supplier.id.toString()}
                      onPress={() => setFormData({...formData, supplier_id: supplier.id.toString()})}
                      style={styles.chip}
                    >
                      {supplier.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            </View>


            <View style={styles.input}>
              <Button
                mode="outlined"
                onPress={handleImagePicker}
                style={styles.imageButton}
                icon="camera"
              >
                {selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Button>
              {selectedImage && (
                <Image source={selectedImage} style={styles.previewImage} />
              )}
            </View>

            <View style={styles.formActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
              >
                {editingProduct ? 'Actualizar' : 'Guardar'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productSupplier: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productSaleType: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: 'bold',
    marginTop: 2,
  },
  productBulkInfo: {
    fontSize: 11,
    color: '#ff9800',
    fontWeight: 'bold',
    marginTop: 2,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 12,
    marginTop: 0,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196f3',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  imageButton: {
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default ProductManagementScreen;