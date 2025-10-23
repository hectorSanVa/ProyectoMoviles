import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { reportsService } from '../services/reportsService';

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  // Usar fecha local en lugar de UTC
  const getLocalDate = () => {
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDate());

  useEffect(() => {
    loadReports();
  }, []);

  // Recargar reportes cuando la pantalla se enfoque
  useFocusEffect(
    React.useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando reportes...');
      console.log('📅 Fecha seleccionada:', selectedDate);
      
      const [summaryRes, dailyRes, topRes, lowStockRes] = await Promise.all([
        reportsService.getSummary(),
        reportsService.getDailySales(selectedDate),
        reportsService.getTopProducts(5, 7),
        reportsService.getLowStockProducts()
      ]);

      console.log('📈 Resumen:', summaryRes);
      console.log('📊 Ventas del día:', dailyRes);
      console.log('🏆 Top productos:', topRes);
      console.log('⚠️ Stock bajo:', lowStockRes);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (dailyRes.success) setDailySales(dailyRes.data);
      if (topRes.success) setTopProducts(topRes.data);
      if (lowStockRes.success) setLowStockProducts(lowStockRes.data);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Resumen General */}
        {summary && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>Resumen General</Title>
                <Button
                  mode="outlined"
                  onPress={loadReports}
                  style={styles.refreshButton}
                  icon="refresh"
                >
                  Actualizar
                </Button>
              </View>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="shopping-cart" size={24} color="#4CAF50" />
                  <Paragraph style={styles.summaryLabel}>Ventas Hoy</Paragraph>
                  <Title style={styles.summaryValue}>{summary.daily_sales.total_sales}</Title>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="attach-money" size={24} color="#2196F3" />
                  <Paragraph style={styles.summaryLabel}>Ingresos</Paragraph>
                  <Title style={styles.summaryValue}>{formatCurrency(summary.daily_sales.total_amount)}</Title>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="inventory" size={24} color="#FF9800" />
                  <Paragraph style={styles.summaryLabel}>Productos</Paragraph>
                  <Title style={styles.summaryValue}>{summary.total_products}</Title>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="warning" size={24} color="#F44336" />
                  <Paragraph style={styles.summaryLabel}>Stock Bajo</Paragraph>
                  <Title style={styles.summaryValue}>{summary.low_stock_products}</Title>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Ventas del Día */}
        {dailySales && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Ventas del Día</Title>
              <View style={styles.salesInfo}>
                <Paragraph>Total de ventas: {dailySales.total_sales}</Paragraph>
                <Paragraph>Monto total: {formatCurrency(dailySales.total_amount)}</Paragraph>
                <Paragraph>Promedio por venta: {formatCurrency(dailySales.average_sale)}</Paragraph>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Top Productos */}
        {topProducts.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Productos Más Vendidos</Title>
              {topProducts.map((product, index) => (
                <View key={product.code} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Paragraph style={styles.productName}>{product.name}</Paragraph>
                    <Paragraph style={styles.productCode}>Código: {product.code}</Paragraph>
                  </View>
                  <View style={styles.productStats}>
                    <Chip style={styles.quantityChip}>
                      {product.total_quantity} vendidos
                    </Chip>
                    <Paragraph style={styles.productRevenue}>
                      {formatCurrency(product.total_revenue)}
                    </Paragraph>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Stock Bajo */}
        {lowStockProducts.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Productos con Stock Bajo</Title>
              {lowStockProducts.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Paragraph style={styles.productName}>{product.name}</Paragraph>
                    <Paragraph style={styles.productCode}>Código: {product.code}</Paragraph>
                  </View>
                  <View style={styles.productStats}>
                    <Chip 
                      style={[styles.stockChip, { backgroundColor: '#F44336' }]}
                      textStyle={{ color: 'white' }}
                    >
                      Stock: {product.stock}
                    </Chip>
                    <Paragraph style={styles.minStock}>
                      Mín: {product.min_stock}
                    </Paragraph>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {loading && (
          <Card style={styles.card}>
            <Card.Content>
              <Paragraph>Cargando reportes...</Paragraph>
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  refreshButton: {
    marginLeft: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  salesInfo: {
    marginTop: 10,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCode: {
    fontSize: 12,
    color: '#666',
  },
  productStats: {
    alignItems: 'flex-end',
  },
  quantityChip: {
    backgroundColor: '#4CAF50',
    marginBottom: 5,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  stockChip: {
    marginBottom: 5,
  },
  minStock: {
    fontSize: 12,
    color: '#666',
  },
});

export default ReportsScreen;