import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Chip, IconButton, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { discountService } from '../services/discountService';
import { useTheme } from '../context/ThemeContext';
import DatePickerComponent from './DatePickerComponent';

const DiscountForm = ({ discount, categories, products, onSave, onCancel }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'global',
    target_id: null,
    discount_percentage: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (discount) {
      setFormData({
        name: discount.name || '',
        description: discount.description || '',
        discount_type: discount.discount_type || 'global',
        target_id: discount.target_id || null,
        discount_percentage: discount.discount_percentage?.toString() || '',
        start_date: discount.start_date || '',
        end_date: discount.end_date || '',
        is_active: discount.is_active !== undefined ? discount.is_active : true
      });
    } else {
      // Establecer fechas por defecto
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      setFormData({
        name: '',
        description: '',
        discount_type: 'global',
        target_id: null,
        discount_percentage: '',
        start_date: today.toISOString().split('T')[0],
        end_date: nextWeek.toISOString().split('T')[0],
        is_active: true
      });
    }
  }, [discount]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.discount_percentage || formData.discount_percentage <= 0) {
      newErrors.discount_percentage = 'El porcentaje debe ser mayor a 0';
    }

    if (formData.discount_percentage > 100) {
      newErrors.discount_percentage = 'El porcentaje no puede ser mayor a 100';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'La fecha de fin es obligatoria';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (formData.discount_type !== 'global' && !formData.target_id) {
      newErrors.target_id = 'Debes seleccionar un objetivo para este tipo de descuento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        target_id: formData.discount_type === 'global' ? null : formData.target_id,
        discount_percentage: parseFloat(formData.discount_percentage),
        is_active: formData.is_active !== undefined ? formData.is_active : true
      };

      if (discount) {
        await discountService.update(discount.id, dataToSend);
        Alert.alert('Éxito', 'Descuento actualizado correctamente');
      } else {
        await discountService.create(dataToSend);
        Alert.alert('Éxito', 'Descuento creado correctamente');
      }

      onSave();
    } catch (error) {
      console.error('Error guardando descuento:', error);
      Alert.alert('Error', error.message || 'Error al guardar el descuento');
    }
  };

  const getAvailableTargets = () => {
    if (formData.discount_type === 'category') return categories;
    if (formData.discount_type === 'product') return products;
    return [];
  };

  const getTargetName = (target) => {
    if (formData.discount_type === 'category') {
      const cat = categories.find(c => c.id === target.id);
      return cat ? cat.name : target.name;
    }
    if (formData.discount_type === 'product') {
      const prod = products.find(p => p.id === target.id);
      return prod ? prod.name : target.name;
    }
    return target.name;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <Title style={[styles.title, { color: theme.colors.onSurface }]}>
          {discount ? 'Editar Descuento' : 'Nuevo Descuento'}
        </Title>
        <IconButton
          icon="close"
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onCancel}
        />
      </View>

      <ScrollView style={styles.content}>
        {/* Nombre */}
        <TextInput
          label="Nombre del Descuento *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
          theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
          mode="outlined"
          error={!!errors.name}
        />

        {/* Descripción */}
        <TextInput
          label="Descripción"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
          theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
          mode="outlined"
          multiline
          numberOfLines={3}
        />

        {/* Tipo de descuento */}
        <View style={styles.section}>
          <Paragraph style={[styles.label, { color: theme.colors.onSurface }]}>
            Tipo de Descuento *
          </Paragraph>
          <View style={styles.chipContainer}>
            <Chip
              selected={formData.discount_type === 'global'}
              onPress={() => {
                setFormData({ ...formData, discount_type: 'global', target_id: null });
                setErrors({ ...errors, target_id: null });
              }}
              style={[styles.chip, { backgroundColor: formData.discount_type === 'global' ? theme.colors.primaryContainer : theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
              textStyle={{ color: formData.discount_type === 'global' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
            >
              🌍 Global
            </Chip>
            <Chip
              selected={formData.discount_type === 'category'}
              onPress={() => setFormData({ ...formData, discount_type: 'category', target_id: null })}
              style={[styles.chip, { backgroundColor: formData.discount_type === 'category' ? theme.colors.primaryContainer : theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
              textStyle={{ color: formData.discount_type === 'category' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
            >
              📂 Por Categoría
            </Chip>
            <Chip
              selected={formData.discount_type === 'product'}
              onPress={() => setFormData({ ...formData, discount_type: 'product', target_id: null })}
              style={[styles.chip, { backgroundColor: formData.discount_type === 'product' ? theme.colors.primaryContainer : theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
              textStyle={{ color: formData.discount_type === 'product' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
            >
              📦 Por Producto
            </Chip>
          </View>
        </View>

        {/* Selección de objetivo */}
        {formData.discount_type !== 'global' && (
          <View style={styles.section}>
            <Paragraph style={[styles.label, { color: theme.colors.onSurface }]}>
              {formData.discount_type === 'category' ? 'Categoría' : 'Producto'} *
            </Paragraph>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              {getAvailableTargets().map(target => (
                <Chip
                  key={target.id}
                  selected={formData.target_id === target.id}
                  onPress={() => {
                    setFormData({ ...formData, target_id: target.id });
                    setErrors({ ...errors, target_id: null });
                  }}
                  style={[styles.chip, { backgroundColor: formData.target_id === target.id ? theme.colors.primaryContainer : theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
                  textStyle={{ color: formData.target_id === target.id ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
                >
                  {getTargetName(target)}
                </Chip>
              ))}
            </ScrollView>
            {errors.target_id && (
              <Paragraph style={{ color: theme.colors.error, marginTop: 4 }}>
                {errors.target_id}
              </Paragraph>
            )}
          </View>
        )}

        {/* Porcentaje de descuento */}
        <TextInput
          label="Porcentaje de Descuento (%) *"
          value={formData.discount_percentage}
          onChangeText={(text) => setFormData({ ...formData, discount_percentage: text })}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.colors.surfaceContainer }]}
          theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
          mode="outlined"
          error={!!errors.discount_percentage}
        />

        {/* Fechas */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <DatePickerComponent
              label="Fecha de Inicio *"
              value={formData.start_date}
              onChange={(date) => setFormData({ ...formData, start_date: date })}
              theme={theme}
            />
          </View>
          <View style={styles.halfWidth}>
            <DatePickerComponent
              label="Fecha de Fin *"
              value={formData.end_date}
              onChange={(date) => setFormData({ ...formData, end_date: date })}
              theme={theme}
            />
          </View>
        </View>

        {/* Botones */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onCancel}
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
            {discount ? 'Actualizar' : 'Crear'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 24,
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

export default DiscountForm;

