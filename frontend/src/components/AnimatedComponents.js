import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

// Animated Button Component
export const AnimatedButton = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  style, 
  icon, 
  color 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <Button
          mode="contained"
          onPress={onPress}
          loading={loading}
          disabled={disabled || loading}
          icon={icon}
          buttonColor={color}
          style={{ borderRadius: 8 }}
          contentStyle={{ paddingVertical: 8 }}
        >
          {loading ? 'Cargando...' : title}
        </Button>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Card Component
export const AnimatedCard = ({ children, style, elevation = 2 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Card style={style} elevation={elevation}>
        {children}
      </Card>
    </Animated.View>
  );
};

export default { AnimatedButton, AnimatedCard };
