import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Searchbar, FAB, TextInput, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { supplierService } from '../services/supplierService';
import { useTheme } from '../context/ThemeContext';

const SuppliersScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getAll({ search: searchQuery });
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setTimeout(() => {
      loadSuppliers();
    }, 500);
  };

  const openForm = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person,
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.contact_person.trim()) {
        Alert.alert('Error', 'Nombre y persona de contacto son obligatorios');
        return;
      }

      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, formData);
        Alert.alert('Éxito', 'Proveedor actualizado correctamente');
      } else {
        await supplierService.create(formData);
        Alert.alert('Éxito', 'Proveedor creado correctamente');
      }

      closeForm();
      loadSuppliers();
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar el proveedor');
    }
  };

  const handleDelete = (supplier) => {
    Alert.alert(
      'Eliminar Proveedor',
      `¿Estás seguro de eliminar a ${supplier.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await supplierService.delete(supplier.id);
              Alert.alert('Éxito', 'Proveedor eliminado correctamente');
              loadSuppliers();
            } catch (error) {
              Alert.alert('Error', error.message || 'Error al eliminar el proveedor');
            }
          }
        }
      ]
    );
  };

  const renderSupplier = ({ item }) => (
    <Card style={[styles.supplierCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.supplierHeader}>
          <View style={styles.supplierInfo}>
            <Title style={[styles.supplierName, { color: theme.colors.onSurface }]}>{item.name}</Title>
            <Paragraph style={[styles.contactPerson, { color: theme.colors.onSurfaceVariant }]}>{item.contact_person}</Paragraph>
          </View>
          <View style={styles.supplierActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => openForm(item)}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDelete(item)}
              iconColor={theme.colors.error}
            />
          </View>
        </View>
        
        <View style={styles.supplierDetails}>
          {item.phone && (
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={16} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>{item.phone}</Paragraph>
            </View>
          )}
          {item.email && (
            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={16} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>{item.email}</Paragraph>
            </View>
          )}
          {item.address && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
              <Paragraph style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>{item.address}</Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.formHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
          <Title style={[styles.formTitle, { color: theme.colors.onSurface }]}>
            {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </Title>
          <IconButton
            icon="close"
            size={24}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={closeForm}
          />
        </View>

        <View style={styles.formContent}>
          <TextInput
            label="Nombre del Proveedor *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
            theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
            mode="outlined"
          />

          <TextInput
            label="Persona de Contacto *"
            value={formData.contact_person}
            onChangeText={(text) => setFormData({ ...formData, contact_person: text })}
            style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
            theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
            mode="outlined"
          />

          <TextInput
            label="Teléfono"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
            theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
            mode="outlined"
            keyboardType="phone-pad"
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
            theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
            mode="outlined"
            keyboardType="email-address"
          />

          <TextInput
            label="Dirección"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
            theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.formActions}>
            <Button
              mode="outlined"
              onPress={closeForm}
              style={styles.cancelButton}
              theme={{ colors: { outline: theme.colors.outline } }}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              {editingSupplier ? 'Actualizar' : 'Crear'}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Buscar proveedores..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceContainer }]}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <FlatList
        data={filteredSuppliers}
        renderItem={renderSupplier}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color={theme.colors.onPrimary}
        onPress={() => openForm()}
        label="Nuevo Proveedor"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchBar: {
    elevation: 0,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  supplierCard: {
    marginBottom: 12,
    elevation: 2,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  contactPerson: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  supplierActions: {
    flexDirection: 'row',
  },
  supplierDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  formContent: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default SuppliersScreen;