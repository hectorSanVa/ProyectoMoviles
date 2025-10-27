import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = ({ style }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={isDarkMode ? "dark-mode" : "light-mode"} 
          size={24} 
          color={theme.colors.primary} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Modo Oscuro
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {isDarkMode ? 'Activado' : 'Desactivado'}
        </Text>
      </View>
      <Switch
        value={isDarkMode}
        onValueChange={toggleTheme}
        color={theme.colors.primary}
        style={styles.switch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  switch: {
    marginLeft: 8,
  },
});

export default DarkModeToggle;
