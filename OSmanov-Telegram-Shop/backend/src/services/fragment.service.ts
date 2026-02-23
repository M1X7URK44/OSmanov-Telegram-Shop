// backend/src/services/fragment.service.ts
import axios, { AxiosInstance } from 'axios';

export interface FragmentStarsOrderRequest {
  username: string;
  quantity: number;
  show_sender?: boolean;
}

export interface FragmentPremiumOrderRequest {
  username: string;
  months: number;
}

export interface FragmentOrderResponse {
  success: boolean;
  order_id?: string;
  payment_url?: string;
  error?: string;
  data?: any;
}

export class FragmentService {
  private apiKey: string;
  private jwtToken: string | null;
  private jwtTokenExpire: number;
  private phoneNumber: string;
  private mnemonics: string[];
  private baseUrl: string;
  private httpClient: AxiosInstance;

  constructor() {
    this.apiKey = process.env.FRAGMENT_API_KEY || '';
    this.jwtToken = process.env.FRAGMENT_JWT_TOKEN || null;
    this.jwtTokenExpire = 0;
    this.phoneNumber = process.env.FRAGMENT_PHONE_NUMBER || '';
    this.mnemonics = process.env.FRAGMENT_MNEMONICS ? process.env.FRAGMENT_MNEMONICS.split(' ') : [];
    this.baseUrl = 'https://api.fragment-api.com/v1';
    
    this.httpClient = axios.create({
      timeout: 300000, // 5 минут для создания заказа
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Получает JWT токен для Fragment API
   * Использует сохраненный токен из конфига или получает новый
   */
  private async getJwtToken(): Promise<string> {
    const now = Date.now();
    
    // Если есть сохраненный JWT токен в конфиге (из .env), используем его
    // Проверяем, что это токен из .env (expire = 0) или кэшированный токен (expire > now)
    if (this.jwtToken) {
      // Если expire = 0, значит это токен из .env - используем его
      if (this.jwtTokenExpire === 0) {
        return this.jwtToken;
      }
      // Если expire > now, значит кэшированный токен еще валиден
      if (this.jwtTokenExpire > now) {
        return this.jwtToken;
      }
    }

    // Получаем новый токен
    try {
      const url = `${this.baseUrl}/auth/authenticate/`;
      const payload = {
        api_key: this.apiKey,
        phone_number: this.phoneNumber,
        mnemonics: this.mnemonics
      };

      const response = await this.httpClient.post(url, payload, {
        timeout: 30000 // 30 секунд для аутентификации
      });

      const token = response.data.token;
      const expiresIn = response.data.expires_in || 3600; // По умолчанию 1 час
      
      this.jwtToken = token;
      this.jwtTokenExpire = now + (expiresIn * 1000) - 30000; // Вычитаем 30 секунд для безопасности

      return token;
    } catch (error: any) {
      console.error('Error getting JWT token:', error.response?.data || error.message);
      throw new Error(`Ошибка при получении JWT токена: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Создает заказ на покупку звезд через Fragment API
   */
  async createStarsOrder(params: FragmentStarsOrderRequest): Promise<FragmentOrderResponse> {
    try {
      const url = `${this.baseUrl}/order/stars/`;
      
      // Убираем @ из username если есть
      const username = params.username.startsWith('@') 
        ? params.username.substring(1) 
        : params.username;

      const data = {
        username: username,
        quantity: params.quantity,
        show_sender: params.show_sender || false
      };

      const jwtToken = await this.getJwtToken();
      
      const response = await this.httpClient.post(url, data, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `JWT ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 минут общий, 1 минута на соединение
      });

      return {
        success: true,
        data: response.data,
        order_id: response.data.id || response.data.order_id,
        payment_url: response.data.payment_url || response.data.url
      };
    } catch (error: any) {
      console.error('Error creating Fragment stars order:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          error: `Timeout при создании заказа для ${params.username}, количество: ${params.quantity}`
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка при создании заказа'
      };
    }
  }

  /**
   * Создает заказ на покупку премиума через Fragment API
   */
  async createPremiumOrder(params: FragmentPremiumOrderRequest): Promise<FragmentOrderResponse> {
    try {
      const url = `${this.baseUrl}/order/premium/`;
      
      // Убираем @ из username если есть
      const username = params.username.startsWith('@') 
        ? params.username.substring(1) 
        : params.username;

      const data = {
        username: username,
        months: params.months
      };

      const jwtToken = await this.getJwtToken();
      
      const response = await this.httpClient.post(url, data, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `JWT ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 секунд для премиума
      });

      return {
        success: true,
        data: response.data,
        order_id: response.data.id || response.data.order_id,
        payment_url: response.data.payment_url || response.data.url
      };
    } catch (error: any) {
      console.error('Error creating Fragment premium order:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка при создании заказа на премиум'
      };
    }
  }
}

export const fragmentService = new FragmentService();
