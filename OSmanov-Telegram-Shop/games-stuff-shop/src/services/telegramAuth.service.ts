import { api } from '../api';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

class TelegramAuthService {
  private token: string | null = null;

  async authenticate(telegramUser: TelegramUser): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/telegram-login', telegramUser);
      
      if (response.data.status === 'success') {
        this.token = response.data.data.token;
        
        // Проверяем что token не null перед сохранением
        if (this.token) {
          localStorage.setItem('auth_token', this.token);
        }
        
        // Устанавливаем токен для всех последующих запросов
        if (this.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        }
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Telegram authentication error:', error);
      throw error;
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
  }

  // Восстановление сессии при загрузке приложения
  async restoreSession(): Promise<boolean> {
    const token = this.getToken();
    
    if (token) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        return response.data.status === 'success';
      } catch (error) {
        this.logout();
        return false;
      }
    }
    
    return false;
  }
}

export const telegramAuthService = new TelegramAuthService();