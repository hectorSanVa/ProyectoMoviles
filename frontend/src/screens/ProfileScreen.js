import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, List } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Perfil de Usuario</Title>
            <View style={styles.userInfo}>
              <MaterialIcons name="person" size={48} color="#2196F3" />
              <View style={styles.userDetails}>
                <Paragraph style={styles.userName}>{user?.username || 'Usuario'}</Paragraph>
                <Paragraph style={styles.userEmail}>{user?.email || 'email@ejemplo.com'}</Paragraph>
                <Paragraph style={styles.userRole}>Rol: {user?.role || 'user'}</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Configuración</Title>
            <List.Item
              title="Notificaciones"
              description="Configurar alertas del sistema"
              left={props => <List.Icon {...props} icon="bell" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
            <List.Item
              title="Tema"
              description="Cambiar apariencia de la app"
              left={props => <List.Icon {...props} icon="palette" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
            <List.Item
              title="Idioma"
              description="Español"
              left={props => <List.Icon {...props} icon="translate" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Información del Sistema</Title>
            <View style={styles.systemInfo}>
              <Paragraph style={styles.infoItem}>
                <MaterialIcons name="info" size={16} color="#666" /> 
                {' '}Versión: 1.0.0
              </Paragraph>
              <Paragraph style={styles.infoItem}>
                <MaterialIcons name="build" size={16} color="#666" /> 
                {' '}Última actualización: Hoy
              </Paragraph>
              <Paragraph style={styles.infoItem}>
                <MaterialIcons name="storage" size={16} color="#666" /> 
                {' '}Base de datos: Conectada
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor="#F44336"
            >
              Cerrar Sesión
            </Button>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
    fontWeight: 'bold',
  },
  systemInfo: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    marginTop: 10,
  },
});

export default ProfileScreen;

