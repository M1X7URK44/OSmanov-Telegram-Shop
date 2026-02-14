// import { adminService } from './admin.service';

// interface ExchangeRatesResponse {
//   rates: {
//     RUB: number;
//     USD: number;
//     EUR: number;
//   };
//   base: string;
//   date: string;
// }

// interface AdminExchangeRate {
//   usd_to_rub_rate: number;
//   updated_at: string;
// }

class CurrencyService {
  private cache: {
    rates: { RUB: number; USD: number; EUR: number } | null;
    timestamp: number;
  } = {
    rates: null,
    timestamp: 0
  };

  private adminRate: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут
  private useAdminRate: boolean = false;

  // Инициализация сервиса
  async initialize(): Promise<void> {
    try {
      // Пытаемся получить курс из админки
      await this.loadAdminRate();
    } catch (error) {
      console.log('Using default exchange rates, admin rate not available');
    }
  }

  // Загрузка курса из админки
  async loadAdminRate(): Promise<void> {
    try {
      // Проверяем, есть ли токен админа (но это для всех пользователей!)
      // Мы будем получать курс через публичный API
      const response = await fetch('/api/admin/settings/public');
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          this.adminRate = result.data.usd_to_rub_rate;
          this.useAdminRate = true;
          console.log('Using admin exchange rate:', this.adminRate);
          
          // Сбрасываем кэш внешнего API
          this.cache = {
            rates: null,
            timestamp: 0
          };
        }
      }
    } catch (error) {
      console.log('Cannot load admin rate, using fallback');
    }
  }

  // Основной метод получения курсов
  async getExchangeRates(): Promise<{ RUB: number; USD: number; EUR: number }> {
    // Если есть курс из админки и он используется
    if (this.useAdminRate && this.adminRate) {
      const customRates = {
        RUB: this.adminRate,
        USD: 1,
        EUR: 0.85 // Примерное соотношение EUR/USD
      };
      
      this.cache = {
        rates: customRates,
        timestamp: Date.now()
      };

      return customRates;
    }

    // Проверяем кэш
    const now = Date.now();
    if (this.cache.rates && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return this.cache.rates;
    }

    return {
      RUB: this.adminRate || 90,
      USD: 1,
      EUR: 0.85
    };

    // try {
    //   // Используем внешний API как fallback
    //   const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
    //   if (!response.ok) {
    //     throw new Error('Failed to fetch exchange rates');
    //   }

    //   const data: ExchangeRatesResponse = await response.json();
      
    //   this.cache = {
    //     rates: data.rates,
    //     timestamp: now
    //   };

    //   // return data.rates;
    // } catch (error) {
    //   console.error('Error fetching exchange rates:', error);
      
    //   // Fallback курсы
    //   return {
    //     RUB: this.adminRate || 90,
    //     USD: 1,
    //     EUR: 0.85
    //   };
    // }
  }

  setAdminRate(newRate: number | null): void {
    this.adminRate = newRate;
  } 


  // Обновить курс из админки
  async refreshAdminRate(): Promise<void> {
    await this.loadAdminRate();
  }

  // Получить текущий курс USD/RUB
  async getUsdToRubRate(): Promise<number> {
    const rates = await this.getExchangeRates();
    return rates.RUB;
  }

  // Конвертация USD в RUB
  async convertUsdToRub(usdAmount: number): Promise<number> {
    const rates = await this.getExchangeRates();
    return usdAmount * rates.RUB;
  }

  // Конвертация из любой валюты в RUB
  async convertToRub(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'RUB') return amount;
    
    const rates = await this.getExchangeRates();
    const rate = rates[fromCurrency as keyof typeof rates];
    
    if (!rate) {
      console.warn(`Unknown currency: ${fromCurrency}, using USD rate`);
      return amount * rates.RUB;
    }
    
    return amount * rates.RUB / rate;
  }

  // Конвертация из любой валюты в USD
  async convertToUsd(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'USD') return amount;
    
    const rates = await this.getExchangeRates();
    const rate = rates[fromCurrency as keyof typeof rates];
    
    if (!rate) {
      console.warn(`Unknown currency: ${fromCurrency}, using USD rate`);
      return amount / rates.RUB;
    }
    
    return amount / rate;
  }

  // Форматирование рублей
  formatRubles(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Форматирование долларов
  formatDollars(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Получить информацию о текущем курсе
  async getRateInfo(): Promise<{
    rate: number;
    source: 'admin' | 'external' | 'fallback';
    updatedAt?: string;
  }> {
    const rates = await this.getExchangeRates();
    
    return {
      rate: rates.RUB,
      source: this.useAdminRate ? 'admin' : (this.cache.rates ? 'external' : 'fallback'),
      updatedAt: this.cache.timestamp ? new Date(this.cache.timestamp).toISOString() : undefined
    };
  }

  // Очистить кэш
  clearCache(): void {
    this.cache = {
      rates: null,
      timestamp: 0
    };
  }
}

export const currencyService = new CurrencyService();