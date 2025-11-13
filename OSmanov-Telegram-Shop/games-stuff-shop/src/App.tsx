import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import HeaderNavigation from "./components/HeaderNavigation.tsx";
import Navigation from './components/Navigation.tsx';
import AppRoutes from './components/AppRoutes.tsx';
import styled from 'styled-components';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';
import { TelegramProvider, useTelegram } from './context/TelegramContext';
import { telegramAuthService } from './services/telegramAuth.service';

// Компонент для инициализации аутентификации
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initData } = useTelegram();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (user && initData) {
        setIsAuthenticating(true);
        try {
          // Пытаемся восстановить сессию
          const hasSession = await telegramAuthService.restoreSession();
          
          if (!hasSession) {
            // Если сессии нет, выполняем аутентификацию через Telegram
            await telegramAuthService.authenticate(user);
          }
          
          console.log('Authentication successful');
        } catch (error) {
          console.error('Authentication failed:', error);
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    initializeAuth();
  }, [user, initData]);

  if (isAuthenticating) {
    return (
      <LoadingScreen>
        <Spinner />
        <LoadingText>Загрузка...</LoadingText>
      </LoadingScreen>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <TelegramProvider>
      <AuthInitializer>
        <UserProvider>
          <CartProvider>
            <Router>
              <AppWindow>
                <HeaderNavigation />
                <main className="main-content">
                  <AppRoutes />
                </main>
                <Navigation />
              </AppWindow>
            </Router>
          </CartProvider>
        </UserProvider>
      </AuthInitializer>
    </TelegramProvider>
  );
};

export default App;

// Styles (остается без изменений)
const AppWindow = styled.div`
  width: 100%;
  height: 100%;
  max-width: 1200px;
  min-width: 200px;
  min-height: 400px;

  display: flex;
  flex-direction: column;

  & .main-content {
    padding-top: 100px;
    padding-bottom: 100px;
    box-sizing: border-box;
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #1a1a2e;
  gap: 20px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(136, 251, 71, 0.3);
  border-top: 4px solid #88FB47;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.span`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
`;