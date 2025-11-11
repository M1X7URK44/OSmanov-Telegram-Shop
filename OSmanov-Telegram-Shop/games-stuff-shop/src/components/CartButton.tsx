import React from 'react';
import styled from 'styled-components';
import { useCart } from '../context/CartContext';
import type { ServiceItem } from '../types/api.types';

interface CartButtonProps {
  service: ServiceItem;
}

const CartButton: React.FC<CartButtonProps> = ({ service }) => {
  const { addItem, removeItem, updateQuantity, getItemQuantity } = useCart();
  
  const quantity = getItemQuantity(service.service_id);

  const handleAdd = () => {
    addItem(service);
  };

  const handleRemove = () => {
    if (quantity > 1) {
      updateQuantity(service.service_id, quantity - 1);
    } else {
      removeItem(service.service_id);
    }
  };

  const handleIncrement = () => {
    updateQuantity(service.service_id, quantity + 1);
  };

  if (quantity === 0) {
    return (
      <AddToCartButton onClick={handleAdd}>
        В корзину
      </AddToCartButton>
    );
  }

  return (
    <QuantityControl>
      <DecreaseButton onClick={handleRemove}>-</DecreaseButton>
      <QuantityDisplay>{quantity}</QuantityDisplay>
      <IncreaseButton onClick={handleIncrement}>+</IncreaseButton>
    </QuantityControl>
  );
};

export default CartButton;

// Styles
const AddToCartButton = styled.button`
  background: #02A5F8;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #0288D1;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  background: #F89D09;
  border-radius: 5px;
  overflow: hidden;
  min-width: 100px;
`;

const BaseQuantityButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const DecreaseButton = styled(BaseQuantityButton)`
  border-right: 1px solid rgba(255, 255, 255, 0.3);
`;

const IncreaseButton = styled(BaseQuantityButton)`
  border-left: 1px solid rgba(255, 255, 255, 0.3);
`;

const QuantityDisplay = styled.span`
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  flex: 1;
  text-align: center;
  min-width: 30px;
`;