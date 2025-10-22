import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const ReportsScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Reportes y Estadísticas</Title>
            <Paragraph>
              Analiza el rendimiento de tu negocio con reportes detallados.
            </Paragraph>
            <Paragraph style={styles.comingSoon}>
              🚧 Funcionalidad en desarrollo
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Reportes Disponibles</Title>
            <View style={styles.reportList}>
              <View style={styles.reportItem}>
                <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
                <View style={styles.reportInfo}>
                  <Paragraph style={styles.reportTitle}>Ventas por Día</Paragraph>
                  <Paragraph style={styles.reportDesc}>Análisis de ventas diarias</Paragraph>
                </View>
              </View>
              <View style={styles.reportItem}>
                <MaterialIcons name="star" size={24} color="#FF9800" />
                <View style={styles.reportInfo}>
                  <Paragraph style={styles.reportTitle}>Productos Más Vendidos</Paragraph>
                  <Paragraph style={styles.reportDesc}>Top productos por ventas</Paragraph>
                </View>
              </View>
              <View style={styles.reportItem}>
                <MaterialIcons name="warning" size={24} color="#F44336" />
                <View style={styles.reportInfo}>
                  <Paragraph style={styles.reportTitle}>Stock Bajo</Paragraph>
                  <Paragraph style={styles.reportDesc}>Productos con stock bajo</Paragraph>
                </View>
              </View>
              <View style={styles.reportItem}>
                <MaterialIcons name="assessment" size={24} color="#2196F3" />
                <View style={styles.reportInfo}>
                  <Paragraph style={styles.reportTitle}>Resumen General</Paragraph>
                  <Paragraph style={styles.reportDesc}>Estadísticas generales</Paragraph>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Estadísticas Actuales</Title>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statNumber}>$0</Paragraph>
                <Paragraph style={styles.statLabel}>Ventas Totales</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statNumber}>0</Paragraph>
                <Paragraph style={styles.statLabel}>Productos Vendidos</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statNumber}>0</Paragraph>
                <Paragraph style={styles.statLabel}>Transacciones</Paragraph>
              </View>
            </View>
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
  reportList: {
    marginTop: 15,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  reportInfo: {
    marginLeft: 15,
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ReportsScreen;

