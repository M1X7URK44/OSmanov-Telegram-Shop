import { api } from '../api/index';

export interface Promocode {
  id: number;
  code: string;
  type: 'balance' | 'discount';
  value: number;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface PromocodeWithUsage extends Promocode {
  usage_count: number;
  used_by_user?: boolean;
}

export interface ActivatePromocodeRequest {
  code: string;
  user_id: number;
}

export interface ActivatePromocodeResponse {
  success: boolean;
  message: string;
  type?: 'balance' | 'discount';
  value?: number;
  new_balance?: number;
}

class PromocodeService {
  private baseUrl = '/promocodes';

  // Активация промокода
  async activatePromocode(
    code: string,
    userId: number
  ): Promise<ActivatePromocodeResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/activate`, {
        code,
        user_id: userId,
      });

      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Ошибка активации промокода');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Ошибка при активации промокода');
    }
  }

  // Получение активного промокода на скидку для пользователя
  async getActiveDiscountPromocode(userId: number): Promise<Promocode | null> {
    try {
      const response = await api.get(`${this.baseUrl}/discount/${userId}`);

      if (response.data.status === 'success') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting active discount promocode:', error);
      return null;
    }
  }

  // Получение всех промокодов (для админ-панели)
  async getAllPromocodes(): Promise<PromocodeWithUsage[]> {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.get(this.baseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error getting all promocodes:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  // Получение промокода по ID (для админ-панели)
  async getPromocodeById(id: number): Promise<Promocode> {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.get(`${this.baseUrl}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error('Промокод не найден');
    } catch (error) {
      console.error('Error getting promocode by id:', error);
      throw error;
    }
  }

  // Создание промокода (для админ-панели)
  async createPromocode(data: {
    code: string;
    type: 'balance' | 'discount';
    value: number;
    is_active?: boolean;
  }): Promise<Promocode> {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.post(
        this.baseUrl,
        {
          code: data.code,
          type: data.type,
          value: data.value,
          is_active: data.is_active !== undefined ? data.is_active : true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Ошибка создания промокода');
    } catch (error: any) {
      console.error('Error creating promocode:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.status === 404) {
        throw new Error('Эндпоинт не найден. Проверьте настройки сервера.');
      }
      throw new Error(error.message || 'Ошибка при создании промокода');
    }
  }

  // Обновление промокода (для админ-панели)
  async updatePromocode(
    id: number,
    data: {
      code?: string;
      type?: 'balance' | 'discount';
      value?: number;
      is_active?: boolean;
    }
  ): Promise<Promocode> {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.put(
        `${this.baseUrl}/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Ошибка обновления промокода');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Ошибка при обновлении промокода');
    }
  }

  // Удаление промокода (для админ-панели)
  async deletePromocode(id: number): Promise<void> {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await api.delete(`${this.baseUrl}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Ошибка удаления промокода');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Ошибка при удалении промокода');
    }
  }
}

export const promocodeService = new PromocodeService();
