import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginData, RegisterData } from '../types/auth';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
        const userData = await apiClient.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      const response = await apiClient.login(data);
      await AsyncStorage.setItem('auth_token', response.access_token);
      apiClient.setToken(response.access_token);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await apiClient.register(data);
      await AsyncStorage.setItem('auth_token', response.access_token);
      apiClient.setToken(response.access_token);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};