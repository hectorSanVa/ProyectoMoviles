import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Paragraph } from 'react-native-paper';
import { offlineSyncService } from '../services/offlineSyncService';
import { useTheme } from '../context/ThemeContext';

const ConnectionIndicator = () => {
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const online = await offlineSyncService.isOnline();
      setIsOnline(online);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#f44336' }]} />
      <Paragraph style={{ color: theme.colors.onSurface, fontSize: 12 }}>
        {isOnline ? 'En línea' : 'Sin conexión'}
      </Paragraph>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});

export default ConnectionIndicator;

