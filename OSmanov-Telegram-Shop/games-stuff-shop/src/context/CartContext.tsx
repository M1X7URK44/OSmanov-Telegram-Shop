import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { ServiceItem } from '../types/api.types';

export interface CartItem extends ServiceItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: ServiceItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { serviceId: number; quantity: number } }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  state: CartState;
  addItem: (item: ServiceItem) => void;
  removeItem: (serviceId: number) => void;
  updateQuantity: (serviceId: number, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (serviceId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Редуктор для управления состоянием корзины
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.service_id === action.payload.service_id);
      
      if (existingItem) {
        // Если товар уже есть, увеличиваем количество
        const updatedItems = state.items.map(item =>
          item.service_id === action.payload.service_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems)
        };
      } else {
        // Добавляем новый товар
        const newItem: CartItem = { ...action.payload, quantity: 1 };
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems)
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.service_id !== action.payload);
      
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { serviceId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Если количество 0 или меньше, удаляем товар
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: serviceId });
      }
      
      const updatedItems = state.items.map(item =>
        item.service_id === serviceId
          ? { ...item, quantity }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0
      };
    
    default:
      return state;
  }
};

// Функция для расчета общей суммы
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const price = item.price || 0;
    return total + (price * item.quantity);
  }, 0);
};

// Провайдер контекста
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0
  });

  const addItem = (item: ServiceItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (serviceId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: serviceId });
  };

  const updateQuantity = (serviceId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { serviceId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (serviceId: number): number => {
    const item = state.items.find(item => item.service_id === serviceId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Хук для использования контекста
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};