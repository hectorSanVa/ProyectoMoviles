import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { TextInput, Modal, Portal } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const DatePickerComponent = ({ label, value, onChange, theme, style }) => {
  const [show, setShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (event.type !== 'dismissed' && date) {
      setSelectedDate(date);
      onChange(formatDate(date));
    }
  };

  const openPicker = () => {
    setShow(true);
  };

  if (Platform.OS === 'android') {
    return (
      <View style={style}>
        <TextInput
          label={label}
          value={value}
          editable={false}
          style={{ backgroundColor: theme.colors.surfaceContainer }}
          theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
          right={
            <TextInput.Icon
              icon="calendar"
              onPress={openPicker}
            />
          }
        />
        
        {show && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
    );
  }

  // iOS
  return (
    <View style={style}>
      <TextInput
        label={label}
        value={value}
        editable={false}
        style={{ backgroundColor: theme.colors.surfaceContainer }}
        theme={{ colors: { primary: theme.colors.primary, text: theme.colors.onSurface, placeholder: theme.colors.onSurfaceVariant, outline: theme.colors.outline } }}
        mode="outlined"
        onPressIn={openPicker}
        right={
          <TextInput.Icon
            icon="calendar"
            onPress={openPicker}
          />
        }
      />
      
      <Portal>
        <Modal visible={show} onDismiss={() => setShow(false)} contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          padding: 20,
          margin: 20,
          borderRadius: 12
        }}>
          <View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              textColor={theme.colors.onSurface}
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

export default DatePickerComponent;

