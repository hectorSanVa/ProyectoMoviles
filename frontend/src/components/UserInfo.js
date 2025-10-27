import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const UserInfo = () => {
  const { theme } = useTheme();
  const { user, role, permissions } = useAuth();

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#ff6b6b';
      case 'cajero':
        return '#4ecdc4';
      default:
        return '#95a5a6';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'cajero':
        return 'Cajero';
      default:
        return 'Usuario';
    }
  };

  if (!user) return null;

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={[styles.title, { color: theme.colors.onSurface }]}>{user.username}</Title>
          <Chip 
            style={[styles.chip, { backgroundColor: getRoleColor(role) }]}
            textStyle={styles.chipText}
          >
            {getRoleLabel(role)}
          </Chip>
        </View>
        <Paragraph style={[styles.email, { color: theme.colors.onSurfaceVariant }]}>{user.email}</Paragraph>
        
        {/* Se elimina la sección de permisos para que se vea más limpio */}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chip: {
    borderRadius: 20,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
    marginBottom: 16,
  },
  permissions: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  permissionRow: {
    marginBottom: 8,
  },
  resource: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
  actionChipText: {
    fontSize: 12,
  },
});

export default UserInfo;

