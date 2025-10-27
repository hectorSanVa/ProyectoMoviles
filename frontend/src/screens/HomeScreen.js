import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedCard, AnimatedButton } from '../components/AnimatedComponents';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { reportsService } from '../services/reportsService';

const HomeScreen = ({ navigation }) => {
  const { user, role } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    total_products: 0,
    daily_sales: { total_sales: 0, total_amount: 0 },
    daily_profit: 0,
    low_stock_products: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Cargar estadísticas reales
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getSummary();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Elementos del menú basados en permisos
  const menuItems = [
    {
      title: 'Productos',
      subtitle: 'Gestionar inventario',
      icon: 'inventory-2',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Products'),
    },
    {
      title: 'Ventas',
      subtitle: 'Procesar transacciones',
      icon: 'point-of-sale',
      color: theme.colors.tertiary,
      onPress: () => navigation.navigate('Sales'),
    },
    {
      title: 'Inventario',
      subtitle: 'Control de stock',
      icon: 'warehouse',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('Inventory'),
    },
    {
      title: 'Reportes',
      subtitle: 'Análisis y estadísticas',
      icon: 'assessment',
      color: theme.colors.info,
      onPress: () => navigation.navigate('Reports'),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.welcomeContainer}>
          <MaterialIcons name="store" size={40} color={theme.colors.primary} />
          <View style={styles.welcomeText}>
            <Title style={[styles.title, { color: theme.colors.onBackground }]}>¡Bienvenido!</Title>
            <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {user?.username || 'Usuario'} - {role === 'admin' ? '👑 Administrador' : '💰 Cajero'}
            </Paragraph>
          </View>
        </View>
      </Animated.View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <AnimatedCard
            key={index}
            style={[
              styles.card,
              { 
                borderLeftColor: item.color, 
                borderLeftWidth: 4,
                backgroundColor: theme.colors.surface
              }
            ]}
            onPress={item.onPress}
            elevation={3}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <MaterialIcons name={item.icon} size={32} color={item.color} />
                </View>
                <View style={styles.cardText}>
                  <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{item.title}</Title>
                  <Paragraph style={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}>{item.subtitle}</Paragraph>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
              </View>
            </Card.Content>
          </AnimatedCard>
        ))}
      </View>

      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.statsTitle, { color: theme.colors.onSurface }]}>📊 Resumen del Sistema</Title>
            {loading ? (
              <ActivityIndicator animating={true} color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <MaterialIcons name="inventory-2" size={24} color={theme.colors.primary} />
                  <Paragraph style={[styles.statNumber, { color: theme.colors.primary }]}>{stats.total_products}</Paragraph>
                  <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Productos</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="point-of-sale" size={24} color={theme.colors.tertiary} />
                  <Paragraph style={[styles.statNumber, { color: theme.colors.tertiary }]}>{stats.daily_sales?.total_sales || 0}</Paragraph>
                  <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Ventas Hoy</Paragraph>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="attach-money" size={24} color={theme.colors.secondary} />
                  <Paragraph style={[styles.statNumber, { color: theme.colors.secondary }]}>
                    ${stats.daily_sales?.total_amount ? Number(stats.daily_sales.total_amount).toFixed(0) : '0'}
                  </Paragraph>
                  <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Ingresos</Paragraph>
                </View>
                {role === 'admin' && (
                  <View style={styles.statItem}>
                    <MaterialIcons name="trending-up" size={24} color={theme.colors.success || '#4CAF50'} />
                    <Paragraph style={[styles.statNumber, { color: theme.colors.success || '#4CAF50' }]}>
                      ${stats.daily_profit ? Number(stats.daily_profit).toFixed(0) : '0'}
                    </Paragraph>
                    <Paragraph style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Ganancias</Paragraph>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  menu: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  statsContainer: {
    padding: 16,
  },
  statsCard: {
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default HomeScreen;