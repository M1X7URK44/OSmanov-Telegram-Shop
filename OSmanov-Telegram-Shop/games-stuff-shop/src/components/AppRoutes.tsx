import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from '../pages/AdminLogin.tsx';
import AdminRoute from './AdminRoute.tsx';

// Lazy loading для оптимизации
const AllGamesPage = lazy(() => import('../pages/AllGames.tsx'));
const ProfilePage = lazy(() => import('../pages/Profile.tsx'));
const ShopCartPage = lazy(() => import('../pages/ShopCart.tsx'));
const SupportPage = lazy(() => import('../pages/Support.tsx'));
const AdminSettingsPage = lazy(() => import('../pages/AdminSettings.tsx'));
const AdminStatisticsPage = lazy(() => import('../pages/AdminStatistics.tsx'));
const AdminPromocodesPage = lazy(() => import('../pages/AdminPromocodes.tsx'));
const AdminUsersPage = lazy(() => import('../pages/AdminUsers.tsx'));
const AdminUserTransactionsPage = lazy(() => import('../pages/AdminUserTransactions.tsx'));
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
      <Routes>
        {/* Основные маршруты */}
        <Route path="/" element={<AllGamesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/shop-cart" element={<ShopCartPage />} />
        <Route path="/support" element={<SupportPage />} />
        
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
        
        {/* Редирект для несуществующих маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;