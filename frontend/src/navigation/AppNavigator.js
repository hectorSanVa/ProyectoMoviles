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
import ProductManagementScreen from '../screens/ProductManagementScreen';
import SuppliersScreen from '../screens/SuppliersScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ConfigScreen from '../screens/ConfigScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ScannerScreen from '../screens/ScannerScreen';

// Importar contexto de autenticación
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack navigator para configuración
function ConfigStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConfigMain" component={ConfigScreen} />
      <Stack.Screen name="ProductManagement" component={ProductManagementScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Navegación principal con tabs
function MainTabNavigator() {
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
              iconName = 'inventory';
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
            case 'Config':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{ title: 'Productos' }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SalesScreen} 
        options={{ title: 'Ventas' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ title: 'Inventario' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ title: 'Reportes' }}
      />
      <Tab.Screen 
        name="Config" 
        component={ConfigStackNavigator} 
        options={{ title: 'Config' }}
      />
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
