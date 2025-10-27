import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Chip, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { productService } from '../services/productService';
import { useTheme } from '../context/ThemeContext';

const ExpirationAlertsScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nearExpiration, setNearExpiration] = useState([]);
  const [expired, setExpired] = useState([]);
  const [activeTab, setActiveTab] = useState('near'); // 'near' o 'expired'

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      const [nearRes, expiredRes] = await Promise.all([
        productService.getNearExpiration(7),
        productService.getExpired()
      ]);

      setNearExpiration(nearRes.data || []);
      setExpired(expiredRes.data || []);

    } catch (error) {
      console.error('Error cargando alertas:', error);
      Alert.alert('Error', 'No se pudieron cargar las alertas de vencimiento');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    loadAlerts();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getDaysColor = (days) => {
    if (days <= 0) return theme.colors.error;
    if (days <= 2) return '#FF9800'; // Naranja
    if (days <= 5) return '#FFC107'; // Amarillo
    return theme.colors.tertiary; // Verde
  };

  const renderProduct = (product) => {
    const days = product.days_until_expiration || product.days_expired || 0;
    const isExpired = days < 0;
    const color = getDaysColor(days);

    return (
      <Card key={product.id} style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Title style={[styles.productName, { color: theme.colors.onSurface }]}>
                {product.name}
              </Title>
              <Paragraph style={[styles.productCode, { color: theme.colors.onSurfaceVariant }]}>
                Código: {product.code}
              </Paragraph>
            </View>
            <Chip
              style={[styles.daysChip, { backgroundColor: color }]}
              textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
            >
              {isExpired
                ? `${Math.abs(days)} días vencido${days !== -1 ? 's' : ''}`
                : `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
            </Chip>
          </View>

          <View style={styles.productDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={16} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                Fecha de vencimiento: {formatDate(product.expiration_date)}
              </Paragraph>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="inventory-2" size={16} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                Stock: {product.stock} unidades
              </Paragraph>
            </View>

            {product.category_name && (
              <View style={styles.detailRow}>
                <MaterialIcons name="category" size={16} color={theme.colors.onSurfaceVariant} />
                <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                  Categoría: {product.category_name}
                </Paragraph>
              </View>
            )}

            {product.supplier_name && (
              <View style={styles.detailRow}>
                <MaterialIcons name="business" size={16} color={theme.colors.onSurfaceVariant} />
                <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
                  Proveedor: {product.supplier_name}
                </Paragraph>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Alertas de Vencimiento
        </Title>
        <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Productos próximos a vencer o vencidos
        </Paragraph>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode={activeTab === 'near' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('near')}
          style={styles.tabButton}
          buttonColor={activeTab === 'near' ? theme.colors.primary : 'transparent'}
          textColor={activeTab === 'near' ? theme.colors.onPrimary : theme.colors.primary}
          icon={() => <MaterialIcons name="schedule" size={20} color={activeTab === 'near' ? theme.colors.onPrimary : theme.colors.primary} />}
        >
          Próximos ({nearExpiration.length})
        </Button>
        <Button
          mode={activeTab === 'expired' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('expired')}
          style={styles.tabButton}
          buttonColor={activeTab === 'expired' ? theme.colors.error : 'transparent'}
          textColor={activeTab === 'expired' ? theme.colors.onError : theme.colors.error}
          icon={() => <MaterialIcons name="error" size={20} color={activeTab === 'expired' ? theme.colors.onError : theme.colors.error} />}
        >
          Vencidos ({expired.length})
        </Button>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {loading ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Paragraph style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                Cargando alertas...
              </Paragraph>
            </Card.Content>
          </Card>
        ) : activeTab === 'near' ? (
          nearExpiration.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="check-circle" size={64} color={theme.colors.tertiary} />
                <Title style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  ¡Todo en orden!
                </Title>
                <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  No hay productos próximos a vencer
                </Paragraph>
              </Card.Content>
            </Card>
          ) : (
            nearExpiration.map(product => renderProduct(product))
          )
        ) : (
          expired.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="check-circle" size={64} color={theme.colors.tertiary} />
                <Title style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  No hay productos vencidos
                </Title>
                <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Todos los productos están vigentes
                </Paragraph>
              </Card.Content>
            </Card>
          ) : (
            expired.map(product => renderProduct(product))
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productCode: {
    fontSize: 14,
    marginTop: 4,
  },
  daysChip: {
    borderRadius: 20,
  },
  productDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyCard: {
    marginTop: 20,
    elevation: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ExpirationAlertsScreen;

