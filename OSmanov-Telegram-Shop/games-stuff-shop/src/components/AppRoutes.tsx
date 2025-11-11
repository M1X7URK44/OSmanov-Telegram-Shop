// components/AppRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AllGamesPage from '../pages/AllGames.tsx';
import ProfilePage from '../pages/Profile.tsx';
import ShopCartPage from '../pages/ShopCart.tsx';
import SupportPage from '../pages/Support.tsx';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AllGamesPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/shop-cart" element={<ShopCartPage />} />
      <Route path="/support" element={<SupportPage />} />
    </Routes>
  );
};

export default AppRoutes;