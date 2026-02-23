import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useUser } from '../context/UserContext';

interface WebAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Редирект для веб-пользователей (не из Telegram) без авторизации на страницу входа
 * 
 * Логика:
 * - Если пользователь НЕ из Telegram И токен отсутствует/истёк И не на странице /auth И не в админке
 *   -> редирект на /auth
 * - Для пользователей из Telegram - пропускаем без проверки (они авторизуются через Telegram WebApp)
 */
export const WebAuthGuard: React.FC<WebAuthGuardProps> = ({ children }) => {
  const { isInTelegram } = useTelegram();
  const { isAuthenticated, loading } = useUser();
  const location = useLocation();

  const isAuthPage = location.pathname === '/auth';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Показываем загрузку пока проверяем токен
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(136, 251, 71, 0.3)',
          borderTop: '4px solid #88FB47',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Для веб-пользователей (не из Telegram): если токен отсутствует или истёк -> редирект на /auth
  if (!isInTelegram && !isAuthenticated && !isAuthPage && !isAdminPage) {
    console.log('WebAuthGuard: Redirecting to /auth', {
      isInTelegram,
      isAuthenticated,
      isAuthPage,
      isAdminPage,
      pathname: location.pathname
    });
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Отладочная информация (можно убрать в продакшене)
  if (process.env.NODE_ENV === 'development') {
    console.log('WebAuthGuard: Allowing access', {
      isInTelegram,
      isAuthenticated,
      isAuthPage,
      isAdminPage,
      pathname: location.pathname
    });
  }

  return <>{children}</>;
};
