import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';

const InventoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' o 'sales'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, salesRes] = await Promise.all([
        productService.getAll(),
        salesService.getAll()
      ]);

      if (productsRes.success) setProducts(productsRes.data);
      if (salesRes.success) setSales(salesRes.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderProduct = ({ item }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>{item.name}</Title>
            <Paragraph style={styles.itemCode}>Código: {item.code}</Paragraph>
          </View>
          <Chip 
            style={[
              styles.stockChip, 
              { backgroundColor: item.stock < item.min_stock ? '#F44336' : '#4CAF50' }
            ]}
            textStyle={{ color: 'white' }}
          >
            Stock: {item.stock}
          </Chip>
        </View>
        <View style={styles.itemDetails}>
          <Paragraph style={styles.itemPrice}>Precio: {formatCurrency(item.sale_price)}</Paragraph>
          <Paragraph style={styles.itemMin}>Mín: {item.min_stock}</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSale = ({ item }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>Venta #{item.sale_number}</Title>
            <Paragraph style={styles.itemCode}>Cliente: {item.customer_name}</Paragraph>
          </View>
          <Chip style={styles.saleChip}>
            {formatCurrency(item.total)}
          </Chip>
        </View>
        <View style={styles.itemDetails}>
          <Paragraph style={styles.itemDate}>{formatDate(item.created_at)}</Paragraph>
          <Paragraph style={styles.itemPayment}>Pago: {item.payment_method}</Paragraph>
        </View>
        {item.items && item.items.length > 0 && (
          <View style={styles.saleItems}>
            <Divider style={styles.divider} />
            <Paragraph style={styles.itemsTitle}>Productos vendidos:</Paragraph>
            {item.items.map((saleItem, index) => (
              <View key={index} style={styles.saleItem}>
                <Paragraph style={styles.saleItemName}>{saleItem.product_name}</Paragraph>
                <Paragraph style={styles.saleItemQty}>Cantidad: {saleItem.quantity}</Paragraph>
                <Paragraph style={styles.saleItemPrice}>{formatCurrency(saleItem.unit_price)}</Paragraph>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = sales.filter(sale =>
    sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.sale_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabButtons}>
          <Button
            mode={activeTab === 'inventory' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('inventory')}
            style={styles.tabButton}
            icon="inventory"
          >
            Inventario
          </Button>
          <Button
            mode={activeTab === 'sales' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('sales')}
            style={styles.tabButton}
            icon="receipt"
          >
            Ventas
          </Button>
        </View>
        <Searchbar
          placeholder={`Buscar ${activeTab === 'inventory' ? 'productos' : 'ventas'}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {activeTab === 'inventory' ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <FlatList
          data={filteredSales}
          renderItem={renderSale}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  tabButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  searchBar: {
    elevation: 0,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stockChip: {
    marginLeft: 8,
  },
  saleChip: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  itemMin: {
    fontSize: 12,
    color: '#666',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  itemPayment: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  saleItems: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  saleItemName: {
    fontSize: 12,
    flex: 1,
    color: '#2c3e50',
  },
  saleItemQty: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  saleItemPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default InventoryScreen;