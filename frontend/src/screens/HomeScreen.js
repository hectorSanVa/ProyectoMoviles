import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const menuItems = [
    {
      title: 'Productos',
      subtitle: 'Gestionar inventario',
      icon: 'inventory',
      color: '#2196F3',
      onPress: () => navigation.navigate('Products'),
    },
    {
      title: 'Ventas',
      subtitle: 'Procesar ventas',
      icon: 'point-of-sale',
      color: '#4CAF50',
      onPress: () => navigation.navigate('Sales'),
    },
    {
      title: 'Inventario',
      subtitle: 'Ver stock actual',
      icon: 'warehouse',
      color: '#FF9800',
      onPress: () => navigation.navigate('Inventory'),
    },
    {
      title: 'Reportes',
      subtitle: 'Estadísticas y análisis',
      icon: 'assessment',
      color: '#9C27B0',
      onPress: () => navigation.navigate('Reports'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Sistema de Inventario</Title>
        <Paragraph style={styles.subtitle}>
          Bienvenido al sistema de gestión
        </Paragraph>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <Card key={index} style={[styles.card, { borderLeftColor: item.color }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <MaterialIcons 
                  name={item.icon} 
                  size={32} 
                  color={item.color} 
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Title style={styles.cardTitle}>{item.title}</Title>
                  <Paragraph style={styles.cardSubtitle}>{item.subtitle}</Paragraph>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={item.onPress}
                style={[styles.button, { backgroundColor: item.color }]}
                labelStyle={styles.buttonLabel}
              >
                Acceder
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Resumen Rápido</Title>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Paragraph style={styles.statNumber}>0</Paragraph>
              <Paragraph style={styles.statLabel}>Productos</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Paragraph style={styles.statNumber}>0</Paragraph>
              <Paragraph style={styles.statLabel}>Ventas Hoy</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Paragraph style={styles.statNumber}>0</Paragraph>
              <Paragraph style={styles.statLabel}>Stock Bajo</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 5,
  },
  menu: {
    padding: 10,
  },
  card: {
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  button: {
    alignSelf: 'flex-end',
  },
  buttonLabel: {
    color: '#fff',
  },
  statsCard: {
    margin: 10,
    elevation: 2,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default HomeScreen;

