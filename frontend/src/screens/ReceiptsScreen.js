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

const ReceiptsScreen = () => {
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
      const receiptsData = await receiptService.getAllReceipts();
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
    <Card style={styles.receiptCard}>
      <Card.Content>
        <Title style={styles.receiptTitle}>Venta #{item.sale_number}</Title>
        <Paragraph style={styles.receiptDate}>
          {formatDate(item.created_at)}
        </Paragraph>
        <Paragraph style={styles.receiptTotal}>
          Total: ${Number(item.total).toFixed(2)}
        </Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => showReceipt(item)}
          style={styles.viewButton}
        >
          Ver
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => deleteReceipt(item.id)}
          style={styles.deleteButton}
        >
          Eliminar
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Comprobantes</Title>
        <Paragraph style={styles.headerSubtitle}>
          {receipts.length} comprobante{receipts.length !== 1 ? 's' : ''} guardado{receipts.length !== 1 ? 's' : ''}
        </Paragraph>
      </View>

      {receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay comprobantes guardados</Text>
          <Text style={styles.emptySubtext}>
            Los comprobantes se guardan automáticamente al realizar ventas
          </Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceipt}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadReceipts} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {receipts.length > 0 && (
        <FAB
          style={styles.clearFab}
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
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>
              Comprobante #{selectedReceipt?.sale_number}
            </Title>
            <View style={styles.receiptContent}>
              <Text style={styles.receiptText}>
                {selectedReceipt?.receiptText}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  receiptCard: {
    marginBottom: 12,
    elevation: 2,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  receiptTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 8,
  },
  viewButton: {
    marginRight: 8,
  },
  deleteButton: {
    borderColor: '#d32f2f',
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  clearFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#d32f2f',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
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
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 400,
  },
  receiptText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 8,
  },
});

export default ReceiptsScreen;
