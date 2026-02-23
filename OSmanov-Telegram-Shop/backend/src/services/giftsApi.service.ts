import axios, { AxiosResponse } from 'axios';
import { 
  Credentials, 
  AuthResponse, 
  Category, 
  Service, 
  OrderInfo, 
  CreateOrderRequest, 
  CreateOrderResponse, 
  PayOrderRequest, 
  PayOrderResponse 
} from '../types/api.types';

const MAIN_URL = 'https://api.ns.gifts';

const getCredentials = (): Credentials => {
  const login = process.env.GIFTS_API_LOGIN;
  const password = process.env.GIFTS_API_PASSWORD;
  
  if (!login || !password) {
    throw new Error('GIFTS_API_LOGIN and GIFTS_API_PASSWORD must be set in environment variables');
  }
  
  return {
    login,
    password
  };
};

class GiftsApiService {
  private async makeRequest<T>(url: string, method: 'GET' | 'POST' = 'POST', headers?: any, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers,
        data,
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  async getAuthToken(): Promise<string> {
    const url = `${MAIN_URL}/api/v1/get_token`;
    const credentials = getCredentials();
    const data = {
      email: credentials.login,
      password: credentials.password
    };

    const response = await this.makeRequest<AuthResponse>(url, 'POST', undefined, data);
    return response.access_token;
  }

  async getAllServices(token: string): Promise<any> {
    const url = `${MAIN_URL}/api/v1/products/get_all_services`;
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return await this.makeRequest(url, 'POST', headers);
  }

  async getCategories(token: string): Promise<any> {
    const url = `${MAIN_URL}/api/v1/products/get_categories`;
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return await this.makeRequest(url, 'POST', headers);
  }

  async getServicesByCategory(token: string, categoryId: number): Promise<any> {
    const url = `${MAIN_URL}/api/v1/products/get_services`;
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    const data = {
      category_id: categoryId
    };

    return await this.makeRequest(url, 'POST', headers, data);
  }

  async getOrderInfo(token: string, custom_id: string): Promise<OrderInfo> {
    const url = `${MAIN_URL}/api/v1/order_info`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const data = {
      custom_id
    };

    return await this.makeRequest<OrderInfo>(url, 'POST', headers, data);
  }

  async createOrder(token: string, orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    const url = `${MAIN_URL}/api/v1/create_order`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    return await this.makeRequest<CreateOrderResponse>(url, 'POST', headers, orderData);
  }

  async payOrder(token: string, custom_id: string): Promise<PayOrderResponse> {
    const url = `${MAIN_URL}/api/v1/pay_order`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const data = {
      custom_id
    };

    return await this.makeRequest<PayOrderResponse>(url, 'POST', headers, data);
  }

  async getSteamCurrencyRates(token: string): Promise<any> {
    const url = `${MAIN_URL}/api/v1/steam/get_currency_rate`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json'
    };

    return await this.makeRequest(url, 'POST', headers);
  }
}

export const giftsApiService = new GiftsApiService();