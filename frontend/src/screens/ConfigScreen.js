import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const ConfigScreen = ({ navigation }) => {
  const configOptions = [
    {
      title: 'Gestión de Productos',
      description: 'Crear, editar y eliminar productos',
      icon: 'inventory',
      onPress: () => navigation.navigate('ProductManagement')
    },
    {
      title: 'Categorías',
      description: 'Organizar productos por categorías',
      icon: 'category',
      onPress: () => navigation.navigate('Categories')
    },
    {
      title: 'Proveedores',
      description: 'Gestionar información de proveedores',
      icon: 'business',
      onPress: () => navigation.navigate('Suppliers')
    },
    {
      title: 'Comprobantes',
      description: 'Ver y gestionar comprobantes de ventas',
      icon: 'receipt',
      onPress: () => navigation.navigate('Receipts')
    },
    {
      title: 'Perfil',
      description: 'Configuración de usuario',
      icon: 'person',
      onPress: () => navigation.navigate('Profile')
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Configuración</Title>
            <Paragraph style={styles.headerSubtitle}>
              Gestiona productos, categorías, proveedores y más
            </Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.optionsContainer}>
          {configOptions.map((option, index) => (
            <Card key={index} style={styles.optionCard} onPress={option.onPress}>
              <Card.Content style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <MaterialIcons name={option.icon} size={24} color="#2196F3" />
                </View>
                <View style={styles.optionText}>
                  <Title style={styles.optionTitle}>{option.title}</Title>
                  <Paragraph style={styles.optionDescription}>
                    {option.description}
                  </Paragraph>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    elevation: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default ConfigScreen;

