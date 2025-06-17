// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          // Set the token in the API client
          authAPI.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          
          // Verify token and get user info
          const response = await authAPI.get('/me');
          setUser(response.data);
          setToken(savedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          delete authAPI.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Login request
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const loginResponse = await authAPI.post('/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = loginResponse.data;
      
      // Set token in localStorage and API headers
      localStorage.setItem('token', access_token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);

      // Get user info
      const userResponse = await authAPI.get('/me');
      setUser(userResponse.data);

      message.success('Вход выполнен успешно');
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      message.error(
        error.response?.data?.detail || 'Ошибка входа. Проверьте email и пароль.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete authAPI.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    message.info('Выход выполнен');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};