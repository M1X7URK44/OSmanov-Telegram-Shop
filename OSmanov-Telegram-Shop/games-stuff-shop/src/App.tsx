// App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import HeaderNavigation from "./components/HeaderNavigation.tsx";
import Navigation from './components/Navigation.tsx';
import AppRoutes from './components/AppRoutes.tsx';
import styled from 'styled-components';
import { CartProvider } from './context/CartContext';
import { UserProvider } from './context/UserContext';

const App: React.FC = () => {
  return (
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
`