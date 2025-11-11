import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userApi } from '../api/user.api';
import type { User, UserProfile } from '../types/api.types';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Временно используем ID 1, позже замените на данные из auth
      const userId = 1;
      const profileData = await userApi.getProfile(userId);
      
      setProfile(profileData);
      setUser(profileData.user);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Не удалось загрузить данные пользователя');
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
      updateBalance
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