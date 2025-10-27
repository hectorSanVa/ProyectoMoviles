import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Modal, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Text, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { userService } from '../services/userService';
import { salesService } from '../services/salesService';
import { useTheme } from '../context/ThemeContext';

const SalesByUserScreen = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSales, setUserSales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar lista de usuarios
      const usersResponse = await userService.getAll();
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }

      // Cargar resumen de ventas por usuario
      const salesResponse = await salesService.getSalesSummaryByUser();
      if (salesResponse.success) {
        setSalesSummary(salesResponse.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserSales = async (userId) => {
    try {
      setLoading(true);
      const response = await salesService.getByUser(userId);
      if (response.success) {
        setUserSales(response.data);
        setSelectedUser(users.find(u => u.id === userId));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getTotalSales = () => {
    return salesSummary.reduce((sum, user) => sum + parseFloat(user.total_revenue || 0), 0);
  };

  const getTotalCount = () => {
    return salesSummary.reduce((sum, user) => sum + parseInt(user.total_sales || 0), 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Ventas por Cajero
            </Title>
            <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Resumen general de ventas por usuario
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Resumen General */}
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Title style={[styles.summaryTitle, { color: theme.colors.onPrimaryContainer }]}>
              Total General
            </Title>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="receipt" size={24} color={theme.colors.onPrimaryContainer} />
                <Paragraph style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>
                  Total Ventas
                </Paragraph>
                <Title style={[styles.summaryValue, { color: theme.colors.onPrimaryContainer }]}>
                  {getTotalCount()}
                </Title>
              </View>
              <View style={styles.summaryItem}>
                <MaterialIcons name="attach-money" size={24} color={theme.colors.onPrimaryContainer} />
                <Paragraph style={[styles.summaryLabel, { color: theme.colors.onPrimaryContainer }]}>
                  Total Recaudado
                </Paragraph>
                <Title style={[styles.summaryValue, { color: theme.colors.onPrimaryContainer }]}>
                  {formatCurrency(getTotalSales())}
                </Title>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Lista de usuarios con ventas */}
        {salesSummary.map((user) => (
          <Card key={user.user_id} style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.userHeader}>
                <MaterialIcons name="person" size={32} color={theme.colors.primary} />
                <View style={styles.userInfo}>
                  <Title style={[styles.userName, { color: theme.colors.onSurface }]}>
                    {user.username}
                  </Title>
                  <Paragraph style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                    {user.email}
                  </Paragraph>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="receipt" size={20} color={theme.colors.primary} />
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Ventas
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {user.total_sales}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="attach-money" size={20} color={theme.colors.primary} />
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Total
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {formatCurrency(user.total_revenue)}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.surfaceContainer }]}>
                  <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Última Venta
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {user.last_sale ? new Date(user.last_sale).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              <Button
                mode="outlined"
                onPress={() => handleViewUserSales(user.user_id)}
                style={styles.viewButton}
                textColor={theme.colors.primary}
              >
                Ver Ventas Detalladas
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Modal para mostrar ventas detalladas del usuario */}
      <Modal
        visible={userSales.length > 0}
        animationType="slide"
        onRequestClose={() => {
          setUserSales([]);
          setSelectedUser(null);
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
            <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Ventas de {selectedUser?.username || 'Usuario'}
            </Title>
            <TouchableOpacity
              onPress={() => {
                setUserSales([]);
                setSelectedUser(null);
              }}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {userSales.length === 0 ? (
              <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Text style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                    No hay ventas registradas
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              userSales.map((sale) => (
                <Card key={sale.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <View style={styles.saleHeader}>
                      <MaterialIcons name="receipt" size={24} color={theme.colors.primary} />
                      <View style={styles.saleInfo}>
                        <Text style={[styles.saleNumber, { color: theme.colors.onSurface }]}>
                          Venta #{sale.sale_number}
                        </Text>
                        <Text style={[styles.saleDate, { color: theme.colors.onSurfaceVariant }]}>
                          {new Date(sale.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <Divider style={{ marginVertical: 12 }} />
                    
                    <View style={styles.saleDetails}>
                      <View style={styles.saleRow}>
                        <Text style={[styles.saleLabel, { color: theme.colors.onSurfaceVariant }]}>Subtotal:</Text>
                        <Text style={[styles.saleValue, { color: theme.colors.onSurface }]}>
                          {formatCurrency(sale.subtotal)}
                        </Text>
                      </View>
                      <View style={styles.saleRow}>
                        <Text style={[styles.saleLabel, { color: theme.colors.onSurfaceVariant }]}>IVA (16%):</Text>
                        <Text style={[styles.saleValue, { color: theme.colors.onSurface }]}>
                          {formatCurrency(sale.tax_amount)}
                        </Text>
                      </View>
                      <Divider style={{ marginVertical: 8 }} />
                      <View style={styles.saleRow}>
                        <Text style={[styles.saleTotalLabel, { color: theme.colors.primary }]}>Total:</Text>
                        <Text style={[styles.saleTotalValue, { color: theme.colors.primary }]}>
                          {formatCurrency(sale.total)}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  summaryCard: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  viewButton: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  saleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  saleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saleDate: {
    fontSize: 14,
    marginTop: 4,
  },
  saleDetails: {
    marginTop: 8,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  saleLabel: {
    fontSize: 14,
  },
  saleValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  saleTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saleTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SalesByUserScreen;

