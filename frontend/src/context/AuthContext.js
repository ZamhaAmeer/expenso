import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    try {
      const token = await AsyncStorage.getItem('expenso_token');
      if (token) {
        const res = await api.get('/auth/me');
        setUser(res.data);
      }
    } catch (e) {
      console.log('Error restoring user session:', e.message);
      await AsyncStorage.removeItem('expenso_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('expenso_token', res.data.token);
    setUser(res.data);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    await AsyncStorage.setItem('expenso_token', res.data.token);
    setUser(res.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('expenso_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
