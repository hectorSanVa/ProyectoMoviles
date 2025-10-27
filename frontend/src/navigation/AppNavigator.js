import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Importar pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SalesScreen from '../screens/SalesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SuppliersScreen from '../screens/SuppliersScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ConfigScreen from '../screens/ConfigScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ExpirationAlertsScreen from '../screens/ExpirationAlertsScreen';
import DiscountsScreen from '../screens/DiscountsScreen';
import UsersScreen from '../screens/UsersScreen';
import SalesByUserScreen from '../screens/SalesByUserScreen';

// Importar contexto de autenticación
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// MainStackNavigator eliminado porque solo contenía un hijo innecesario

// Stack navigator para configuración
function ConfigStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConfigMain" component={ConfigScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="Discounts" component={DiscountsScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="SalesByUser" component={SalesByUserScreen} />
      <Stack.Screen name="ExpirationAlerts" component={ExpirationAlertsScreen} />
      <Stack.Screen name="ProfileNav" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Navegación principal con tabs
function MainTabNavigator() {
  const { role, hasPermission } = useAuth();
  const { theme } = useTheme();

  // Verificar que el rol esté definido
  if (!role) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Products':
              iconName = 'inventory-2';
              break;
            case 'Sales':
              iconName = 'point-of-sale';
              break;
            case 'Inventory':
              iconName = 'warehouse';
              break;
            case 'Reports':
              iconName = 'assessment';
              break;
            case 'Receipts':
              iconName = 'receipt';
              break;
            case 'Config':
              iconName = 'settings';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      {/* Admin: Todas las pestañas */}
      {role === 'admin' && (
        <>
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Inicio' }}
          />
          
          {hasPermission('products', 'read') && (
            <Tab.Screen 
              name="Inventory" 
              component={InventoryScreen} 
              options={{ title: 'Inventario' }}
            />
          )}
          
          {(hasPermission('reports', 'daily') || hasPermission('reports', 'all')) && (
            <Tab.Screen 
              name="Reports" 
              component={ReportsScreen} 
              options={{ title: 'Reportes' }}
            />
          )}
          
          <Tab.Screen 
            name="Receipts" 
            component={ReceiptsScreen} 
            options={{ title: 'Comprobantes' }}
          />
          
          <Tab.Screen 
            name="Config" 
            component={ConfigStackNavigator} 
            options={{ title: 'Config' }}
          />
        </>
      )}
      
      {/* Cajero: Inicio, Productos, Nueva Venta, Mis Ventas y Perfil */}
      {role === 'cajero' && (
        <>
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Inicio' }}
          />
          
          {hasPermission('products', 'read') && (
            <Tab.Screen 
              name="Products" 
              component={ProductsScreen} 
              options={{ title: 'Productos' }}
            />
          )}
          
          {hasPermission('sales', 'create') && (
            <Tab.Screen 
              name="Sales" 
              component={SalesScreen} 
              options={{ title: 'Nueva Venta' }}
            />
          )}
          
          <Tab.Screen 
            name="Receipts" 
            component={ReceiptsScreen} 
            options={{ title: 'Mis Ventas' }}
          />
          
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Perfil' }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

// Navegador principal de la aplicación
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Aquí podrías mostrar un splash screen
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
