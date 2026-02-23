import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api';
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

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Проверяем наличие токена
      const hasToken = telegramAuthService.isAuthenticated();
      
      if (!hasToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Проверяем валидность токена через API
      // Это важно для веб-пользователей - если токен истёк, нужно разлогинить
      try {
        const response = await api.get('/auth/me');
        if (response.data.status === 'success') {
          const userId = response.data.data.user.id;
          setCurrentUserId(userId);
          setIsAuthenticated(true);
          
          // Загружаем профиль пользователя
          const profileData = await userApi.getProfile(userId);
          setProfile(profileData);
          setUser(profileData.user);
        } else {
          // Токен невалиден
          telegramAuthService.logout();
          setIsAuthenticated(false);
          setCurrentUserId(null);
        }
      } catch (apiError: any) {
        // Если ошибка 401 или 403 - токен истёк или невалиден
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          console.log('Token expired or invalid, logging out');
          telegramAuthService.logout();
          setIsAuthenticated(false);
          setCurrentUserId(null);
        } else {
          // Если это ошибка сети или другая ошибка - считаем что токен невалиден для безопасности
          // (лучше попросить пользователя войти заново)
          console.warn('API error during auth check:', apiError);
          // Не очищаем токен при сетевых ошибках, но и не считаем авторизованным
          setIsAuthenticated(false);
          setCurrentUserId(null);
          throw apiError;
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Не удалось загрузить данные пользователя');
      // Если ошибка аутентификации, разлогиниваем
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
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