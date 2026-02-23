import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from '../pages/AdminLogin.tsx';
import AdminRoute from './AdminRoute.tsx';
import { WebAuthGuard } from './WebAuthGuard.tsx';

// Lazy loading для оптимизации
const AllGamesPage = lazy(() => import('../pages/AllGames.tsx'));
const ProfilePage = lazy(() => import('../pages/Profile.tsx'));
const ShopCartPage = lazy(() => import('../pages/ShopCart.tsx'));
const SupportPage = lazy(() => import('../pages/Support.tsx'));
const AuthPage = lazy(() => import('../pages/AuthPage.tsx'));
const TelegramStarsPage = lazy(() => import('../pages/TelegramStars.tsx'));
const AdminSettingsPage = lazy(() => import('../pages/AdminSettings.tsx'));
const AdminStatisticsPage = lazy(() => import('../pages/AdminStatistics.tsx'));
const AdminPromocodesPage = lazy(() => import('../pages/AdminPromocodes.tsx'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsers.tsx'));
const AdminUserTransactionsPage = lazy(() => import('../pages/AdminUserTransactions.tsx'));
const AdminPaymentsByDatePage = lazy(() => import('../pages/AdminPaymentsByDate.tsx'));
const AdminLayout = lazy(() => import('./AdminLayout.tsx'));

// Loading компонент
const LoadingFallback = () => (
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

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WebAuthGuard>
        <Routes>
          {/* Страница входа/регистрации для веб-пользователей */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Основные маршруты */}
          <Route path="/" element={<AllGamesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/shop-cart" element={<ShopCartPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/telegram-stars" element={<TelegramStarsPage />} />
          
          {/* Админ маршруты */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
        
        {/* Защищенные админ маршруты */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="dashboard">
                <Navigate to="/admin/settings" replace />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/settings" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="settings">
                <AdminSettingsPage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/statistics" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="statistics">
                <AdminStatisticsPage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/promocodes" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="promocodes">
                <AdminPromocodesPage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="users">
                <AdminUsersPage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/user-transactions" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="user-transactions">
                <AdminUserTransactionsPage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/payments-by-date" 
          element={
            <AdminRoute>
              <AdminLayout currentPage="payments-by-date">
                <AdminPaymentsByDatePage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        {/* Редирект для несуществующих маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WebAuthGuard>
    </Suspense>
  );
};

export default AppRoutes;