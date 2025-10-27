import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, List, Switch, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserInfo from '../components/UserInfo';
import { GradientButton } from '../components/EnhancedComponents';
import DarkModeToggle from '../components/DarkModeToggle';

const ProfileScreen = () => {
  const { user, logout, permissions, role } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <UserInfo />

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.title, { color: theme.colors.onSurface }]}>Configuración</Title>
            
            <DarkModeToggle style={styles.listItem} />
            
            <List.Item
              title="Notificaciones"
              description="Configurar alertas del sistema"
              left={props => <List.Icon {...props} icon="bell" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            
            <List.Item
              title="Idioma"
              description="Español"
              left={props => <List.Icon {...props} icon="translate" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
              titleStyle={{ color: theme.colors.onSurface }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.title, { color: theme.colors.onSurface }]}>Información del Sistema</Title>
            <View style={styles.systemInfo}>
              <Paragraph style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                <MaterialIcons name="info" size={16} color={theme.colors.onSurfaceVariant} /> 
                {' '}Versión: 1.0.0
              </Paragraph>
              <Paragraph style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                <MaterialIcons name="build" size={16} color={theme.colors.onSurfaceVariant} /> 
                {' '}Última actualización: Hoy
              </Paragraph>
              <Paragraph style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                <MaterialIcons name="storage" size={16} color={theme.colors.onSurfaceVariant} /> 
                {' '}Base de datos: Conectada
              </Paragraph>
              <Paragraph style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                <MaterialIcons name="person" size={16} color={theme.colors.onSurfaceVariant} /> 
                {' '}Rol: {user?.role || 'Usuario'}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <GradientButton
              title="Cerrar Sesión"
              onPress={handleLogout}
              icon="logout"
              colors={['#F44336', '#D32F2F']}
              style={styles.logoutButton}
            />
          </Card.Content>
        </Card>
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
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listItem: {
    paddingVertical: 8,
  },
  systemInfo: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 10,
  },
});

export default ProfileScreen;

