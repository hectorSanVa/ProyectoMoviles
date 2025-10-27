import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Divider, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { reportsService } from '../services/reportsService';
import { useTheme } from '../context/ThemeContext';

const ReportsScreen = () => {
  const { theme } = useTheme();
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
      console.log('📅 Ventas diarias:', dailyRes);
      console.log('🏆 Top productos:', topRes);
      console.log('⚠️ Stock bajo:', lowStockRes);

      setSummary(summaryRes.data);
      setDailySales(dailyRes.data);
      setTopProducts(topRes.data || []);
      setLowStockProducts(lowStockRes.data || []);
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
    const value = parseFloat(amount || 0);
    if (isNaN(value)) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Resumen General */}
        {summary && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Resumen General</Title>
                <Button
                  mode="outlined"
                  onPress={loadReports}
                  style={styles.refreshButton}
                  icon="refresh"
                  textColor={theme.colors.primary}
                  buttonColor="transparent"
                >
                  Actualizar
                </Button>
              </View>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="shopping-cart" size={24} color={theme.colors.tertiary} />
                  <Paragraph style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Ventas Hoy</Paragraph>
                  <Title style={[styles.summaryValue, { color: theme.colors.onSurface }]}>{summary.daily_sales.total_sales}</Title>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="attach-money" size={24} color={theme.colors.primary} />
                  <Paragraph style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Ingresos</Paragraph>
                  <Title style={[styles.summaryValue, { color: theme.colors.onSurface }]}>{formatCurrency(summary.daily_sales.total_amount)}</Title>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="inventory" size={24} color={theme.colors.secondary} />
                  <Paragraph style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Productos</Paragraph>
                  <Title style={[styles.summaryValue, { color: theme.colors.onSurface }]}>{summary.total_products}</Title>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="error" size={24} color={theme.colors.error} />
                  <Paragraph style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Stock Bajo</Paragraph>
                  <Title style={[styles.summaryValue, { color: theme.colors.onSurface }]}>{summary.low_stock_count}</Title>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Ventas del Día */}
        {dailySales && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Ventas del Día</Title>
              <View style={styles.salesInfo}>
                <Paragraph style={[styles.salesText, { color: theme.colors.onSurfaceVariant }]}>
                  Total de ventas: {dailySales.total_sales}
                </Paragraph>
                <Paragraph style={[styles.salesText, { color: theme.colors.onSurfaceVariant }]}>
                  Monto total: {formatCurrency(dailySales.total_amount)}
                </Paragraph>
                <Paragraph style={[styles.salesText, { color: theme.colors.onSurfaceVariant }]}>
                  Promedio por venta: {formatCurrency(dailySales.average_amount || 0)}
                </Paragraph>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Productos Más Vendidos */}
        {topProducts.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Productos Más Vendidos</Title>
              {topProducts.map((product, index) => (
                <View key={product.id || `top-${index}`} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Paragraph style={[styles.productName, { color: theme.colors.onSurface }]}>{product.name}</Paragraph>
                    <Paragraph style={[styles.productCode, { color: theme.colors.onSurfaceVariant }]}>
                      Código: {product.code}
                    </Paragraph>
                  </View>
                  <View style={styles.productStats}>
                    <Chip 
                      style={[styles.quantityChip, { backgroundColor: theme.colors.tertiary }]}
                      textStyle={{ color: theme.colors.onTertiary }}
                    >
                      {product.total_quantity} vendidos
                    </Chip>
                    <Paragraph style={[styles.productRevenue, { color: theme.colors.onSurface }]}>
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
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Productos con Stock Bajo</Title>
              {lowStockProducts.map((product, index) => (
                <View key={product.id || `low-${index}`} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Paragraph style={[styles.productName, { color: theme.colors.onSurface }]}>{product.name}</Paragraph>
                    <Paragraph style={[styles.productCode, { color: theme.colors.onSurfaceVariant }]}>
                      Código: {product.code}
                    </Paragraph>
                  </View>
                  <View style={styles.productStats}>
                    <Chip 
                      style={[styles.stockChip, { backgroundColor: theme.colors.error }]}
                      textStyle={{ color: theme.colors.onError }}
                    >
                      Stock: {product.stock}
                    </Chip>
                    <Paragraph style={[styles.minStock, { color: theme.colors.onSurfaceVariant }]}>
                      Mín: {product.min_stock}
                    </Paragraph>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {loading && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Paragraph style={{ color: theme.colors.onSurface }}>Cargando reportes...</Paragraph>
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
    paddingTop: 20,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
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
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  salesInfo: {
    marginTop: 10,
  },
  salesText: {
    fontSize: 14,
    marginBottom: 5,
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
  },
  productStats: {
    alignItems: 'flex-end',
  },
  quantityChip: {
    marginBottom: 5,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stockChip: {
    marginBottom: 5,
  },
  minStock: {
    fontSize: 12,
  },
});

export default ReportsScreen;