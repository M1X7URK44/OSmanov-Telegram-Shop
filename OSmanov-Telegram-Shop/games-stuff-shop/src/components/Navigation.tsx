// components/Navigation.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styled from 'styled-components';

// Icons
import AllGamesIcon from "../assets/icons/menu-games-icon.svg";
import ProfileIcon from "../assets/icons/menu-profile-icon.svg";
import ShopCartIcon from "../assets/icons/menu-shop-cart-icon.svg";
import SupportIcon from "../assets/icons/menu-support-icon.svg";

import ActiveAllGamesIcon from "../assets/icons/menu-active-games-icon.svg"; // разные иконки для активного состояния
import ActiveProfileIcon from "../assets/icons/menu-active-profile-icon.svg";
import ActiveShopCartIcon from "../assets/icons/menu-active-shop-cart-icon.svg";
import ActiveSupportIcon from "../assets/icons/menu-active-support-icon.svg";

const Navigation: React.FC = () => {
  const { state } = useCart();
  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  
  return (
    <NavigationPanel>
      <NavButton to="/">
        {({ isActive }) => (
          <>
            <img 
              src={isActive ? ActiveAllGamesIcon : AllGamesIcon} 
              alt="GamesLogo" 
            />
            <span>Games</span>
          </>
        )}
      </NavButton>
      
      <NavButton to="/profile">
        {({ isActive }) => (
          <>
            <img 
              src={isActive ? ActiveProfileIcon : ProfileIcon} 
              alt="ProfileLogo" 
            />
            <span>Profile</span>
          </>
        )}
      </NavButton>
      
      <NavButton to="/shop-cart">
        {({ isActive }) => (
          <>
            <CartIconContainer>
              <img 
                src={isActive ? ActiveShopCartIcon : ShopCartIcon} 
                alt="ShopCartLogo" 
              />
              {totalItems > 0 && (
                <CartBadge>{totalItems}</CartBadge>
              )}
            </CartIconContainer>
            <span>Shop Cart</span>
          </>
        )}
      </NavButton>
      
      <NavButton to="/support">
        {({ isActive }) => (
          <>
            <img 
              src={isActive ? ActiveSupportIcon : SupportIcon} 
              alt="SupportLogo" 
            />
            <span>Support</span>
          </>
        )}
      </NavButton>
    </NavigationPanel>
  );
};

export default Navigation;

// Styles
const NavigationPanel = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  z-index: 999;

  @media (min-width: 1200px) {
    left: calc((100% - var(--max-window-width)) / 2);
  }

  margin-top: auto;
  margin-bottom: 0;
  min-height: 90px;
  max-height: 90px;
  height: 100%;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
  box-sizing: border-box;

  background: rgba(21, 25, 50, 0.8);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  max-width: var(--max-window-width);
`;

const NavButton = styled(NavLink)`
  text-decoration: none;
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    color: #fff;
  }

  &:hover img {
    filter: brightness(0) saturate(100%) invert(68%) sepia(90%) saturate(500%) hue-rotate(360deg) brightness(100%) contrast(105%);
  }

  /* Активное состояние */
  &.active {
    color: #FFF;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 3px;
      background: #F89D09;
      border-radius: 2px;
    }
  }

  &.active img {
    filter: brightness(0) saturate(100%) invert(68%) sepia(90%) saturate(500%) hue-rotate(360deg) brightness(100%) contrast(105%);
  }
`;

const CartIconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CartBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #F89D09;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "ChakraPetch-Regular";
`;