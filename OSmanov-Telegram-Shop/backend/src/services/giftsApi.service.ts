import axios, { AxiosResponse } from 'axios';
import { Credentials, AuthResponse, Category, Service, ApiResponse } from '../types/api.types';

const MAIN_URL = 'https://api.ns.gifts';

const credentials: Credentials = {
  login: "djosmanov",
  password: "Th2PPs2PAi"
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
}

export const giftsApiService = new GiftsApiService();