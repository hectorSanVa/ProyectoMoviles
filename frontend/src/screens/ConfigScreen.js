import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ConfigScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const configOptions = [
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
      title: 'Descuentos',
      description: 'Gestionar descuentos y promociones',
      icon: 'local-offer',
      onPress: () => navigation.navigate('Discounts')
    },
    {
      title: 'Usuarios',
      description: 'Crear y gestionar cajeros',
      icon: 'people',
      onPress: () => navigation.navigate('Users')
    },
    {
      title: 'Ventas por Cajero',
      description: 'Ver ventas individuales de cada cajero',
      icon: 'person-pin',
      onPress: () => navigation.navigate('SalesByUser')
    },
    {
      title: 'Alertas de Vencimiento',
      description: 'Productos próximos a vencer o vencidos',
      icon: 'schedule',
      onPress: () => navigation.navigate('ExpirationAlerts')
    },
    {
      title: 'Perfil',
      description: 'Ver y editar información de tu cuenta',
      icon: 'person',
      onPress: () => navigation.navigate('ProfileNav')
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Configuración</Title>
            <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Gestiona productos, categorías, proveedores y más
            </Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.optionsContainer}>
          {configOptions.map((option, index) => (
            <Card key={index} style={[styles.optionCard, { backgroundColor: theme.colors.surface }]} onPress={option.onPress}>
              <Card.Content style={styles.optionContent}>
                <View style={[styles.optionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialIcons name={option.icon} size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Title style={[styles.optionTitle, { color: theme.colors.onSurface }]}>{option.title}</Title>
                  <Paragraph style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {option.description}
                  </Paragraph>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    elevation: 1,
    borderRadius: 12,
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
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default ConfigScreen;

