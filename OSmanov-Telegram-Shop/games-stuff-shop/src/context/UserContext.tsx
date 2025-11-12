import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userApi } from '../api/user.api';
import { telegramAuthService } from '../services/telegramAuth.service';
import type { User, UserProfile } from '../types/api.types';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  isAuthenticated: boolean;
  logout: () => void;
  currentUserId: number | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const getCurrentUserId = async (): Promise<number | null> => {
    try {
      const token = telegramAuthService.getToken();
      if (token) {
        // Простая временная реализация - в продакшене нужно декодировать JWT
        // Пока будем получать ID через API /auth/me
        const response = await api.get('/auth/me');
        if (response.data.status === 'success') {
          return response.data.data.user.id;
        }
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
    }
    return null;
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Проверяем аутентификацию
      const authenticated = telegramAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        setLoading(false);
        return;
      }

      // Получаем ID текущего пользователя
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);

      if (userId) {
        const profileData = await userApi.getProfile(userId);
        setProfile(profileData);
        setUser(profileData.user);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Не удалось загрузить данные пользователя');
      // Если ошибка аутентификации, разлогиниваем
      if (err instanceof Error && err.message.includes('401')) {
        telegramAuthService.logout();
        setIsAuthenticated(false);
        setCurrentUserId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUserData();
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      setUser(prev => prev ? { ...prev, balance: newBalance } : null);
    }
    
    if (profile) {
      setProfile(prev => prev ? { 
        ...prev, 
        user: { ...prev.user, balance: newBalance } 
      } : null);
    }
  };

  const logout = () => {
    telegramAuthService.logout();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setCurrentUserId(null);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      profile,
      loading,
      error,
      refreshUser,
      updateBalance,
      isAuthenticated,
      logout,
      currentUserId
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Добавляем импорт api
import { api } from '../api';