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
  isInTelegram: boolean;
  isFullscreen: boolean;
  openLink: (url: string) => void;
  expand: () => void;
  close: () => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isInTelegram, setIsInTelegram] = useState<boolean>(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      const hasInitData = tg.initData && tg.initData.length > 0;
      const userData = tg.initDataUnsafe?.user;
      
      if (hasInitData && userData) {
        setIsInTelegram(true);
        setWebApp(tg);

        tg.ready();
        setUser(userData);
        setInitData(tg.initData);

        // Расширяем на полный экран с небольшой задержкой для надежности
        setTimeout(() => {
          tg.expand();
          setIsExpanded(tg.isExpanded || false);
          
          // Проверяем и запрашиваем полноэкранный режим
          if (tg.requestFullscreen) {
            // Проверяем доступность метода isAvailable (если он существует)
            const isFullscreenAvailable = tg.requestFullscreen.isAvailable 
              ? tg.requestFullscreen.isAvailable() 
              : true;
              
            if (isFullscreenAvailable) {
              try {
                tg.requestFullscreen();
                setIsFullscreen(true);
              } catch (error) {
                console.warn('Failed to request fullscreen:', error);
              }
            }
          }
        }, 100);

        // Слушаем изменения viewport
        tg.onEvent('viewportChanged', () => {
          setIsExpanded(tg.isExpanded || false);
        });

        // Слушаем изменения полноэкранного режима (если поддерживается)
        if (tg.onEvent('fullscreenChanged')) {
          tg.onEvent('fullscreenChanged', () => {
            setIsFullscreen(tg.isFullscreen || false);
          });
        }

        // Настройка интерфейса
        tg.setHeaderColor('#1a1a2e');
        tg.setBackgroundColor('#1a1a2e');

        // Устанавливаем цвет статус-бара для нативных приложений
        if (tg.setBottomBarColor) {
          tg.setBottomBarColor('#1a1a2e');
        }

        console.log('Telegram WebApp initialized:', {
          user: userData,
          platform: tg.platform,
          version: tg.version,
          isExpanded: tg.isExpanded,
          isFullscreen: tg.isFullscreen
        });
      } else {
        setIsInTelegram(false);
        console.warn('Telegram WebApp script loaded but no user data - running in browser mode');
      }
    } else {
      setIsInTelegram(false);
      console.warn('Telegram WebApp not found - running in browser mode');
    }

    // Cleanup function
    return () => {
      if (webApp) {
        webApp.offEvent('viewportChanged');
        webApp.offEvent('fullscreenChanged');
      }
    };
  }, []);

  const openLink = (url: string) => {
    if (webApp) {
      webApp.openLink(url);
    }
  };

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

  const requestFullscreen = () => {
    if (webApp?.requestFullscreen) {
      try {
        webApp.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.warn('Failed to request fullscreen:', error);
      }
    }
  };

  const exitFullscreen = () => {
    if (webApp?.exitFullscreen) {
      try {
        webApp.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.warn('Failed to exit fullscreen:', error);
      }
    }
  };

  return (
    <TelegramContext.Provider value={{
      webApp,
      user,
      initData,
      isExpanded,
      isFullscreen,
      isInTelegram,
      openLink,
      expand,
      close,
      requestFullscreen,
      exitFullscreen
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