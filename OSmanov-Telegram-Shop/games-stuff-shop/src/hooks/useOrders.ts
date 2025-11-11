import { useState, useCallback, useMemo } from 'react';
import { orderService, type CheckoutResponse, type CheckoutItemResult } from '../services/orderService';
import { type CartItem } from '../context/CartContext';

export interface OrderState {
  loading: boolean;
  error: string | null;
  result: CheckoutResponse | null;
}

export interface UseOrdersReturn extends OrderState {
  checkout: (userId: number, items: CartItem[]) => Promise<CheckoutResponse>;
  reset: () => void;
  // Статистика
  successCount: number;
  failedCount: number;
  totalAmount: number;
  // Группированные результаты
  successItems: CheckoutItemResult[];
  failedItems: CheckoutItemResult[];
  pendingItems: CheckoutItemResult[];
  // Валидация
  validateCheckout: (items: CartItem[]) => string | null;
  // Утилиты
  getStatusText: (status: number) => string;
  getStatusColor: (status: number) => string;
  requiresUserData: (serviceName: string) => boolean;
}

export const useOrders = (): UseOrdersReturn => {
  const [state, setState] = useState<OrderState>({
    loading: false,
    error: null,
    result: null,
  });

  const checkout = useCallback(async (userId: number, items: CartItem[]): Promise<CheckoutResponse> => {
    setState({ loading: true, error: null, result: null });
    
    try {
      // Валидация перед отправкой
      const validationError = orderService.validateCartForCheckout(items);
      if (validationError) {
        throw new Error(validationError);
      }

      const result = await orderService.checkout({ 
        user_id: userId, 
        items 
      });
      
      setState({ loading: false, error: null, result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({ loading: false, error: errorMessage, result: null });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  // Вычисляемые значения
  const successCount = useMemo(() => 
    state.result?.data.total_processed || 0, 
    [state.result]
  );

  const failedCount = useMemo(() => 
    state.result?.data.total_failed || 0, 
    [state.result]
  );

  const totalAmount = useMemo(() => 
    state.result?.data.total_amount || 0, 
    [state.result]
  );

  const successItems = useMemo(() => 
    state.result?.data.results.filter(item => item.success) || [], 
    [state.result]
  );

  const failedItems = useMemo(() => 
    state.result?.data.results.filter(item => !item.success) || [], 
    [state.result]
  );

  const pendingItems = useMemo(() => 
    state.result?.data.results.filter(item => item.status === 1) || [], 
    [state.result]
  );

  const validateCheckout = useCallback((items: CartItem[]): string | null => {
    return orderService.validateCartForCheckout(items);
  }, []);

  const getStatusText = useCallback((status: number): string => {
    return orderService.getOrderStatusText(status);
  }, []);

  const getStatusColor = useCallback((status: number): string => {
    return orderService.getOrderStatusColor(status);
  }, []);

  const requiresUserData = useCallback((serviceName: string): boolean => {
    return orderService.requiresUserData(serviceName);
  }, []);

  return {
    // Состояние
    ...state,
    // Методы
    checkout,
    reset,
    validateCheckout,
    getStatusText,
    getStatusColor,
    requiresUserData,
    // Статистика
    successCount,
    failedCount,
    totalAmount,
    // Группированные результаты
    successItems,
    failedItems,
    pendingItems,
  };
};