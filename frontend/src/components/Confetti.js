import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const ConfettiPiece = ({ delay, duration, color, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: Math.random() * 200 - 100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 720,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, [delay, duration]);

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          left: startX,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            })},
          ],
          opacity,
        },
      ]}
    />
  );
};

const Confetti = ({ visible, onComplete }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Ocultar después de 3 segundos
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onComplete && onComplete();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const confettiPieces = [];

  // Generar 50 piezas de confetti
  for (let i = 0; i < 50; i++) {
    confettiPieces.push(
      <ConfettiPiece
        key={i}
        delay={i * 50}
        duration={2000 + Math.random() * 1000}
        color={colors[Math.floor(Math.random() * colors.length)]}
        startX={Math.random() * width}
      />
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      {confettiPieces}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default Confetti;
