import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip, Badge, Dialog, Portal, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { discountService } from '../services/discountService';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { useTheme } from '../context/ThemeContext';
import DiscountForm from '../components/DiscountForm';

const DiscountsScreen = () => {
  const { theme } = useTheme();
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [discountsRes, categoriesRes, productsRes] = await Promise.all([
        discountService.getAll(),
        categoryService.getAll(),
        productService.getAll()
      ]);

      if (discountsRes.success) setDiscounts(discountsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (discount = null) => {
    setEditingDiscount(discount);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDiscount(null);
  };

  const handleSave = () => {
    loadData();
    closeForm();
  };

  const handleDeleteClick = (discount) => {
    setDiscountToDelete(discount);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      await discountService.delete(discountToDelete.id);
      Alert.alert('Éxito', 'Descuento eliminado correctamente');
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al eliminar el descuento');
    } finally {
      setShowDeleteDialog(false);
      setDiscountToDelete(null);
    }
  };

  const getTargetName = (discount) => {
    if (discount.discount_type === 'global') return 'Global';
    if (discount.discount_type === 'category') {
      const category = categories.find(c => c.id === discount.target_id);
      return category ? category.name : 'Sin categoría';
    }
    if (discount.discount_type === 'product') {
      const product = products.find(p => p.id === discount.target_id);
      return product ? product.name : 'Sin producto';
    }
    return 'N/A';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isActive = (discount) => {
    const today = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return start <= today && end >= today && discount.is_active;
  };

  const getDiscountStatus = (discount) => {
    if (!discount.is_active) return { text: 'Inactivo', color: theme.colors.error };
    
    const today = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);

    if (today < start) return { text: 'Próximo', color: theme.colors.secondary };
    if (today > end) return { text: 'Vencido', color: theme.colors.error };
    return { text: 'Activo', color: theme.colors.tertiary };
  };

  if (showForm) {
    return (
      <DiscountForm
        discount={editingDiscount}
        categories={categories}
        products={products}
        onSave={handleSave}
        onCancel={closeForm}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {discounts.length === 0 && !loading ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="local-offer" size={64} color={theme.colors.onSurfaceVariant} />
              <Title style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                No hay descuentos
              </Title>
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Crea tu primer descuento para ofrecer promociones
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          discounts.map(discount => {
            const status = getDiscountStatus(discount);

            return (
              <Card
                key={discount.id}
                style={[styles.discountCard, { backgroundColor: theme.colors.surface }]}
              >
                <Card.Content>
                  <View style={styles.titleRow}>
                    <Title style={[styles.discountTitle, { color: theme.colors.onSurface }]}>
                      {discount.name}
                    </Title>
                    <Badge
                      style={[styles.statusBadge, { backgroundColor: status.color }]}
                      size={20}
                    >
                      {status.text}
                    </Badge>
                  </View>

                  {discount.description && (
                    <Paragraph style={[styles.discountDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {discount.description}
                    </Paragraph>
                  )}

                  <Divider style={{ marginVertical: 12, backgroundColor: theme.colors.outline }} />

                  <View style={styles.discountDetails}>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="tag" size={16} color={theme.colors.onSurfaceVariant} />
                      <Paragraph style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Tipo:</Paragraph>
                      <Paragraph style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                        {discount.discount_type === 'global' ? '🌍 Global' : 
                         discount.discount_type === 'category' ? '📂 Categoría' : '📦 Producto'}
                      </Paragraph>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialIcons name="store" size={16} color={theme.colors.onSurfaceVariant} />
                      <Paragraph style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Aplica a:</Paragraph>
                      <Paragraph style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                        {getTargetName(discount)}
                      </Paragraph>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialIcons name="percent" size={16} color={theme.colors.error} />
                      <Paragraph style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Descuento:</Paragraph>
                      <Paragraph style={[styles.detailValue, { color: theme.colors.error, fontWeight: 'bold' }]}>
                        {discount.discount_percentage}%
                      </Paragraph>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialIcons name="calendar-today" size={16} color={theme.colors.onSurfaceVariant} />
                      <Paragraph style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Vigencia:</Paragraph>
                      <Paragraph style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                        {formatDate(discount.start_date)} - {formatDate(discount.end_date)}
                      </Paragraph>
                    </View>
                  </View>

                  <View style={styles.discountActions}>
                    <Button
                      mode="outlined"
                      onPress={() => openForm(discount)}
                      style={styles.actionButton}
                      theme={{ colors: { outline: theme.colors.outline } }}
                      textColor={theme.colors.primary}
                      icon="pencil"
                    >
                      Editar
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleDeleteClick(discount)}
                      style={styles.actionButton}
                      theme={{ colors: { outline: theme.colors.error } }}
                      textColor={theme.colors.error}
                      icon="delete"
                    >
                      Eliminar
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color={theme.colors.onPrimary}
        onPress={() => openForm()}
        label="Nuevo Descuento"
      />

      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Eliminar Descuento
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
              ¿Estás seguro de que quieres eliminar el descuento "{discountToDelete?.name}"?
              Esta acción no se puede deshacer.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDeleteDialog(false)}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleDelete}
              textColor={theme.colors.error}
            >
              Eliminar
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
    paddingBottom: 80,
  },
  discountCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  discountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    marginLeft: 8,
  },
  discountDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  discountDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  discountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyCard: {
    marginTop: 50,
    elevation: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default DiscountsScreen;

