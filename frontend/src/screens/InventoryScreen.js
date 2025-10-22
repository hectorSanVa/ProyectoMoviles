import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const InventoryScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Inventario Actual</Title>
            <Paragraph>
              Visualiza y gestiona el stock de tus productos.
            </Paragraph>
            <Paragraph style={styles.comingSoon}>
              🚧 Funcionalidad en desarrollo
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Resumen de Stock</Title>
            <View style={styles.stockSummary}>
              <View style={styles.stockItem}>
                <MaterialIcons name="inventory" size={24} color="#4CAF50" />
                <View style={styles.stockInfo}>
                  <Paragraph style={styles.stockNumber}>0</Paragraph>
                  <Paragraph style={styles.stockLabel}>Productos en Stock</Paragraph>
                </View>
              </View>
              <View style={styles.stockItem}>
                <MaterialIcons name="warning" size={24} color="#FF9800" />
                <View style={styles.stockInfo}>
                  <Paragraph style={styles.stockNumber}>0</Paragraph>
                  <Paragraph style={styles.stockLabel}>Stock Bajo</Paragraph>
                </View>
              </View>
              <View style={styles.stockItem}>
                <MaterialIcons name="error" size={24} color="#F44336" />
                <View style={styles.stockInfo}>
                  <Paragraph style={styles.stockNumber}>0</Paragraph>
                  <Paragraph style={styles.stockLabel}>Sin Stock</Paragraph>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Productos</Title>
            <Paragraph style={styles.emptyState}>
              No hay productos registrados aún
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  comingSoon: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    color: '#666',
  },
  stockSummary: {
    marginTop: 15,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  stockInfo: {
    marginLeft: 15,
    flex: 1,
  },
  stockNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default InventoryScreen;

