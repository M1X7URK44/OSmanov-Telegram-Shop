import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramContextType {
  webApp: any;
  user: TelegramUser | null;
  initData: string;
  isExpanded: boolean;
  openLink: (url: string) => void;
  expand: () => void;
  close: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);

      // Инициализация
      tg.ready();
      
      // Получаем данные пользователя
      const userData = tg.initDataUnsafe?.user;
      if (userData) {
        setUser(userData);
      }

      // Получаем initData для аутентификации
      setInitData(tg.initData);

      // Расширяем на полный экран
      tg.expand();
      setIsExpanded(true);

      // Настройка интерфейса
      tg.setHeaderColor('#1a1a2e');
      tg.setBackgroundColor('#1a1a2e');

      console.log('Telegram WebApp initialized:', {
        user: userData,
        platform: tg.platform,
        version: tg.version
      });
    } else {
      console.warn('Telegram WebApp not found - running in browser mode');
    }
  }, []);

  const openLink = (url: string) => {
    if (webApp) {
      webApp.openLink(url);
    }
  }

  const expand = () => {
    if (webApp) {
      webApp.expand();
      setIsExpanded(true);
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  return (
    <TelegramContext.Provider value={{
      webApp,
      user,
      initData,
      isExpanded,
      openLink,
      expand,
      close
    }}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};