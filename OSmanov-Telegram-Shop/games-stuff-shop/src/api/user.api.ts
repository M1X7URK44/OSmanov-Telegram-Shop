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
  }
};