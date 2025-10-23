import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Searchbar, FAB, TextInput, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { categoryService } from '../services/categoryService';

const CategoriesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll({ search: searchQuery });
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setTimeout(() => {
      loadCategories();
    }, 500);
  };

  const openForm = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'El nombre de la categoría es obligatorio');
        return;
      }

      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
      } else {
        await categoryService.create(formData);
        Alert.alert('Éxito', 'Categoría creada correctamente');
      }

      closeForm();
      loadCategories();
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar la categoría');
    }
  };

  const handleDelete = (category) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de eliminar la categoría "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.delete(category.id);
              Alert.alert('Éxito', 'Categoría eliminada correctamente');
              loadCategories();
            } catch (error) {
              Alert.alert('Error', error.message || 'Error al eliminar la categoría');
            }
          }
        }
      ]
    );
  };

  const renderCategory = ({ item }) => (
    <Card style={styles.categoryCard}>
      <Card.Content>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <Title style={styles.categoryName}>{item.name}</Title>
            {item.description && (
              <Paragraph style={styles.categoryDescription}>{item.description}</Paragraph>
            )}
          </View>
          <View style={styles.categoryActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => openForm(item)}
              iconColor="#2196F3"
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDelete(item)}
              iconColor="#F44336"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (showForm) {
    return (
      <View style={styles.container}>
        <View style={styles.formHeader}>
          <Title style={styles.formTitle}>
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </Title>
          <IconButton
            icon="close"
            size={24}
            onPress={closeForm}
          />
        </View>

        <View style={styles.formContent}>
          <TextInput
            label="Nombre de la Categoría *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Descripción"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Descripción opcional de la categoría"
          />

          <View style={styles.formActions}>
            <Button
              mode="outlined"
              onPress={closeForm}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
            >
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Buscar categorías..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => openForm()}
        label="Nueva Categoría"
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
  categoryCard: {
    marginBottom: 12,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoryActions: {
    flexDirection: 'row',
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

export default CategoriesScreen;

