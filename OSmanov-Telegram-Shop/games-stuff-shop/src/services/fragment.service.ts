// frontend/src/services/fragment.service.ts
import { api } from '../api';

export interface FragmentStarsOrderResponse {
  success: boolean;
  order_id?: string;
  payment_url?: string;
  total_price_rub?: number;
  total_price_usd?: number;
  new_balance_usd?: number;
  error?: string;
}

export interface FragmentPremiumOrderResponse {
  success: boolean;
  order_id?: string;
  payment_url?: string;
  total_price_rub?: number;
  total_price_usd?: number;
  new_balance_usd?: number;
  error?: string;
}

class FragmentService {
  /**
   * Создает заказ на покупку Telegram Stars
   * @param username - @username получателя (с @ или без)
   * @param quantity - Количество звезд
   * @returns Ответ с информацией о заказе
   */
  async createStarsOrder(
    username: string,
    quantity: number
  ): Promise<FragmentStarsOrderResponse> {
    try {
      const response = await api.post('/fragment/stars', {
        username: username.trim(),
        quantity: quantity
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating stars order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании заказа на звезды'
      };
    }
  }

  /**
   * Создает заказ на покупку Telegram Premium
   * @param username - @username получателя (с @ или без)
   * @param months - Количество месяцев Premium
   * @returns Ответ с информацией о заказе
   */
  async createPremiumOrder(
    username: string,
    months: number
  ): Promise<FragmentPremiumOrderResponse> {
    try {
      const response = await api.post('/fragment/premium', {
        username: username.trim(),
        months: months
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating premium order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при создании заказа на премиум'
      };
    }
  }
}

export const fragmentService = new FragmentService();
