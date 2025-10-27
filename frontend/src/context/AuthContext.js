import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  permissions: null,
  role: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        permissions: action.payload.permissions,
        role: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        permissions: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        permissions: action.payload.permissions,
        role: action.payload.role,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Restaurar token al iniciar la app
    restoreToken();
  }, []);

  const restoreToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      const permissions = await AsyncStorage.getItem('permissions');
      const role = await AsyncStorage.getItem('role');
      
      if (token && user) {
        dispatch({
          type: 'RESTORE_TOKEN',
          payload: { 
            token, 
            user: JSON.parse(user),
            permissions: permissions ? JSON.parse(permissions) : null,
            role: role || null
          },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error restaurando token:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (userData, token, permissions, role) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (permissions) {
        await AsyncStorage.setItem('permissions', JSON.stringify(permissions));
      }
      if (role) {
        await AsyncStorage.setItem('role', role);
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData, token, permissions, role },
      });
    } catch (error) {
      console.error('Error guardando datos de login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('permissions');
      await AsyncStorage.removeItem('role');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const value = {
    ...state,
    login,
    logout,
    // Funciones de utilidad para permisos
    hasPermission: (resource, action) => {
      if (!state.permissions) return false;
      return state.permissions[resource] && state.permissions[resource][action];
    },
    isAdmin: () => state.role === 'admin',
    isCashier: () => state.role === 'cajero',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

