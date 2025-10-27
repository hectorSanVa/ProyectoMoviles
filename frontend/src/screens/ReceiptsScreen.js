import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Portal, Modal } from 'react-native-paper';
import { receiptService } from '../services/receiptService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ConnectionIndicator from '../components/ConnectionIndicator';

const ReceiptsScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth(); // Obtener el usuario actual
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar comprobantes al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadReceipts();
    }, [])
  );

  const loadReceipts = async () => {
    try {
      setLoading(true);
      // Si el usuario es cajero, filtrar por su user_id; si es admin, mostrar todos
      const filterByUserId = user.role === 'cajero' ? user.id : null;
      const receiptsData = await receiptService.getAllReceipts(filterByUserId);
      // Ordenar por fecha más reciente
      const sortedReceipts = receiptsData.sort((a, b) => b.timestamp - a.timestamp);
      setReceipts(sortedReceipts);
    } catch (error) {
      console.error('Error cargando comprobantes:', error);
      Alert.alert('Error', 'No se pudieron cargar los comprobantes');
    } finally {
      setLoading(false);
    }
  };

  const showReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const deleteReceipt = (receiptId) => {
    Alert.alert(
      'Eliminar Comprobante',
      '¿Estás seguro de que quieres eliminar este comprobante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await receiptService.deleteReceipt(receiptId);
              if (result.success) {
                loadReceipts();
                Alert.alert('Éxito', 'Comprobante eliminado');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el comprobante');
            }
          }
        }
      ]
    );
  };

  const clearAllReceipts = () => {
    Alert.alert(
      'Limpiar Todos los Comprobantes',
      '¿Estás seguro de que quieres eliminar TODOS los comprobantes? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar Todo', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await receiptService.clearAllReceipts();
              if (result.success) {
                setReceipts([]);
                Alert.alert('Éxito', 'Todos los comprobantes han sido eliminados');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los comprobantes');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReceipt = ({ item }) => (
    <Card style={[styles.receiptCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Title style={[styles.receiptTitle, { color: theme.colors.onSurface }]}>Venta #{item.sale_number}</Title>
        <Paragraph style={[styles.receiptDate, { color: theme.colors.onSurfaceVariant }]}>
          {formatDate(item.created_at)}
        </Paragraph>
        {item.cashier_name && (
          <Paragraph style={[styles.cashierName, { color: theme.colors.onSurfaceVariant }]}>
            Cajero: {item.cashier_name}
          </Paragraph>
        )}
        <Paragraph style={[styles.receiptTotal, { color: theme.colors.primary }]}>
          Total: ${Number(item.total).toFixed(2)}
        </Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => showReceipt(item)}
          style={styles.viewButton}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        >
          Ver
        </Button>
        {/* Solo admin puede eliminar comprobantes */}
        {user.role === 'admin' && (
          <Button 
            mode="outlined" 
            onPress={() => deleteReceipt(item.id)}
            style={styles.deleteButton}
            textColor={theme.colors.error}
            theme={{ colors: { outline: theme.colors.error } }}
          >
            Eliminar
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ marginTop: 35, paddingVertical: 2 }}>
        <ConnectionIndicator />
      </View>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Comprobantes</Title>
        <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {receipts.length} comprobante{receipts.length !== 1 ? 's' : ''} guardado{receipts.length !== 1 ? 's' : ''}
        </Paragraph>
      </View>

      {receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No hay comprobantes guardados</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
            Los comprobantes se guardan automáticamente al realizar ventas
          </Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceipt}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={loadReceipts}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* FAB solo para admin */}
      {receipts.length > 0 && user.role === 'admin' && (
        <FAB
          style={[styles.clearFab, { backgroundColor: theme.colors.error }]}
          icon="delete-sweep"
          label="Limpiar Todo"
          onPress={clearAllReceipts}
        />
      )}

      {/* Modal para mostrar comprobante */}
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalContent}>
            <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Comprobante #{selectedReceipt?.sale_number}
            </Title>
            <View style={[styles.receiptContent, { backgroundColor: theme.colors.surfaceContainer }]}>
              <Text style={[styles.receiptText, { color: theme.colors.onSurface }]}>
                {selectedReceipt?.receiptText}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              Cerrar
            </Button>
          </View>
        </Modal>
      </Portal>
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
  listContainer: {
    padding: 16,
  },
  receiptCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  receiptDate: {
    fontSize: 14,
    marginTop: 4,
  },
  cashierName: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  receiptTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  viewButton: {
    marginRight: 8,
  },
  deleteButton: {
    // borderColor se maneja dinámicamente
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  clearFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptContent: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 400,
  },
  receiptText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 8,
  },
});

export default ReceiptsScreen;
