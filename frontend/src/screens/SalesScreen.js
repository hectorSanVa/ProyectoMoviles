import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const SalesScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Proceso de Ventas</Title>
            <Paragraph>
              Aquí podrás procesar las ventas de productos.
            </Paragraph>
            <Paragraph style={styles.comingSoon}>
              🚧 Funcionalidad en desarrollo
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Flujo de Venta</Title>
            <View style={styles.flowSteps}>
              <View style={styles.step}>
                <MaterialIcons name="qr-code-scanner" size={24} color="#2196F3" />
                <Paragraph style={styles.stepText}>1. Escanear producto</Paragraph>
              </View>
              <View style={styles.step}>
                <MaterialIcons name="add-shopping-cart" size={24} color="#4CAF50" />
                <Paragraph style={styles.stepText}>2. Agregar al carrito</Paragraph>
              </View>
              <View style={styles.step}>
                <MaterialIcons name="calculate" size={24} color="#FF9800" />
                <Paragraph style={styles.stepText}>3. Calcular total</Paragraph>
              </View>
              <View style={styles.step}>
                <MaterialIcons name="payment" size={24} color="#9C27B0" />
                <Paragraph style={styles.stepText}>4. Procesar pago</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Ventas Recientes</Title>
            <Paragraph style={styles.emptyState}>
              No hay ventas registradas aún
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
  flowSteps: {
    marginTop: 15,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
  stepText: {
    marginLeft: 15,
    fontSize: 16,
    flex: 1,
  },
  emptyState: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default SalesScreen;

