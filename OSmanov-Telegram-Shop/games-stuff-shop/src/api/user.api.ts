import { api } from './index';
import type { UserProfile, BalanceUpdateRequest } from '../types/api.types';

export const userApi = {
  // Получить профиль пользователя
  getProfile: async (userId: number): Promise<UserProfile> => {
    const response = await api.get(`/user/profile/${userId}`);
    return response.data.data;
  },

  // Пополнить баланс
  updateBalance: async (userId: number, data: BalanceUpdateRequest) => {
    const response = await api.post(`/user/balance/${userId}`, data);
    return response.data.data;
  },

  // Получить историю покупок
  getPurchaseHistory: async (userId: number, limit: number = 10) => {
    const response = await api.get(`/user/purchases/${userId}?limit=${limit}`);
    return response.data.data;
  },

  // Получить историю транзакций
  getTransactionHistory: async (userId: number, limit: number = 20) => {
    const response = await api.get(`/user/transactions/${userId}?limit=${limit}`);
    return response.data.data;
  },

  getOrderInfo: async (customId: string) => {
    const response = await api.post('/user/order-info', { custom_id: customId });
    
    // Добавим отладку
    console.log('📡 API Response for order info:', response.data);
    
    if (response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get order info');
    }
  },
};