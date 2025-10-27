import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, Dialog, Portal, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { userService } from '../services/userService';
import { useTheme } from '../context/ThemeContext';

const UsersScreen = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('cajero');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await userService.create({
        username,
        email,
        password,
        role_name: role
      });

      if (response.success) {
        Alert.alert('Éxito', 'Usuario creado exitosamente');
        resetForm();
        setDialogVisible(false);
        loadUsers();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el usuario');
    }
  };

  const handleDelete = (user) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar a ${user.username}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await userService.delete(user.id);
              if (response.success) {
                Alert.alert('Éxito', 'Usuario eliminado exitosamente');
                loadUsers();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('cajero');
    setSelectedUser(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#F44336';
      case 'cajero':
        return '#2196F3';
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUsers}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Gestión de Usuarios
            </Title>
            <Paragraph style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Administra los usuarios del sistema
            </Paragraph>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => setDialogVisible(true)}
          icon={() => <MaterialIcons name="person-add" size={20} color="#fff" />}
          style={styles.addButton}
        >
          Crear Cajero
        </Button>

        {users.map((user) => (
          <Card key={user.id} style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.userInfo}>
                <View style={styles.userDetails}>
                  <Title style={[styles.userName, { color: theme.colors.onSurface }]}>
                    {user.username}
                  </Title>
                  <Paragraph style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                    {user.email}
                  </Paragraph>
                  <Chip
                    icon={() => <MaterialIcons name="person" size={16} color="#fff" />}
                    style={[styles.roleChip, { backgroundColor: getRoleColor(user.role_name) }]}
                    textStyle={{ color: '#fff' }}
                  >
                    {user.role_name}
                  </Chip>
                </View>
                <Button
                  mode="outlined"
                  onPress={() => handleDelete(user)}
                  textColor={theme.colors.error}
                >
                  Eliminar
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => {
            setDialogVisible(false);
            resetForm();
          }}
          style={{ backgroundColor: theme.colors.background }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Crear Nuevo Cajero
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Usuario"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setDialogVisible(false);
                resetForm();
              }}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleCreate}
              buttonColor={theme.colors.primary}
              textColor="#fff"
            >
              Crear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  addButton: {
    marginBottom: 16,
  },
  userCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  input: {
    marginBottom: 12,
  },
});

export default UsersScreen;

