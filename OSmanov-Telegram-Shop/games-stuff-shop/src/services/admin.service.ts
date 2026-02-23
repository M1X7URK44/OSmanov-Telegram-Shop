// Типы
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}

export interface AdminSettings {
  usd_to_rub_rate: number;
  min_deposit_amount: number;
  max_deposit_amount: number;
  telegram_star_price_rub?: number;
  telegram_premium_price_rub?: number;
  telegram_premium_3m_price_rub?: number;
  telegram_premium_6m_price_rub?: number;
  telegram_premium_12m_price_rub?: number;
  updated_at: string;
  updated_by: number;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  token: string;
  user: AdminUser;
}

export interface UpdateExchangeRateRequest {
  usd_to_rub_rate: number;
}

class AdminService {
  private baseUrl = '/api/admin';
  private token: string | null = null;

  // Авторизация
  async login(credentials: AdminLoginRequest): Promise<AdminAuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      this.token = result.data.token;
      if (this.token) {
        localStorage.setItem('admin_token', this.token);
      }
      return result.data;
    } else {
      throw new Error(result.message || 'Authentication failed');
    }
  }

  // Получение настроек
  async getSettings(): Promise<AdminSettings> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    const result = await response.json();
    return result.data;
  }

  // Обновление курса
  async updateExchangeRate(rate: number): Promise<AdminSettings> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/settings/exchange-rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usd_to_rub_rate: rate }),
    });

    if (!response.ok) {
      throw new Error('Failed to update exchange rate');
    }

    const result = await response.json();
    return result.data;
  }

  // Обновление цен Telegram Stars / Premium
  async updateTelegramPrices(
    starPriceRub: number,
    premiumPriceRub: number
  ): Promise<AdminSettings> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/settings/telegram-prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_star_price_rub: starPriceRub,
        telegram_premium_price_rub: premiumPriceRub,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update telegram prices');
    }

    const result = await response.json();
    return result.data;
  }

  // Обновление цен Telegram Premium (3, 6, 12 месяцев)
  async updatePremiumPrices(
    premium3mPriceRub: number,
    premium6mPriceRub: number,
    premium12mPriceRub: number
  ): Promise<AdminSettings> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/settings/premium-prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegram_premium_3m_price_rub: premium3mPriceRub,
        telegram_premium_6m_price_rub: premium6mPriceRub,
        telegram_premium_12m_price_rub: premium12mPriceRub,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update premium prices');
    }

    const result = await response.json();
    return result.data;
  }

  // Получение профиля
  async getProfile(): Promise<AdminUser> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const result = await response.json();
    return result.data.user;
  }

  // Выход
  logout(): void {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  // Проверка авторизации
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Получение токена
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  // Восстановление сессии
  async restoreSession(): Promise<boolean> {
    const token = this.getToken();
    
    if (token) {
      try {
        const response = await fetch(`${this.baseUrl}/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        return response.ok;
      } catch (error) {
        this.logout();
        return false;
      }
    }
    
    return false;
  }

  // Получение статистики
  async getStatistics(): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    const result = await response.json();
    return result.data;
  }

  // Получение пользователей
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<{ users: any[], total: number, totalPages: number }> {
    const token = this.getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    
    const response = await fetch(`${this.baseUrl}/users?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const result = await response.json();
    return result.data;
  }

  // Обновление баланса пользователя
  async updateUserBalance(userId: number, balance: number): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/users/balance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, balance }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user balance');
    }

    const result = await response.json();
    return result.data;
  }

  // Получение покупок пользователя (для админ-панели)
  async getUserPurchases(options: { userId?: number; username?: string; page?: number; limit?: number }):
    Promise<{ user: any; purchases: any[]; total: number; totalPages: number }> {
    const token = this.getToken();
    const params = new URLSearchParams();

    if (options.userId) {
      params.append('userId', options.userId.toString());
    }
    if (options.username) {
      params.append('username', options.username);
    }

    params.append('page', (options.page || 1).toString());
    params.append('limit', (options.limit || 20).toString());

    const response = await fetch(`${this.baseUrl}/user-purchases?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user purchases');
    }

    const result = await response.json();
    return result.data;
  }

  // Получение платежей по диапазону дат
  async getPaymentsByDateRange(startDate: string, endDate: string, page: number = 1, limit: number = 50):
    Promise<{ payments: any[]; total: number; totalPages: number }> {
    const token = this.getToken();
    const params = new URLSearchParams({
      startDate,
      endDate,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/payments-by-date?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payments');
    }

    const result = await response.json();
    return result.data;
  }
}

export const adminService = new AdminService();