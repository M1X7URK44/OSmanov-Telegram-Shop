// Типы для ответа API курсов валют
interface ExchangeRatesResponse {
  rates: {
    RUB: number;
    USD: number;
    EUR: number;
  };
  base: string;
  date: string;
}

class CurrencyService {
  private cache: {
    rates: { RUB: number; USD: number; EUR: number } | null;
    timestamp: number;
  } = {
    rates: null,
    timestamp: 0
  };

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

  async getExchangeRates(): Promise<{ RUB: number; USD: number; EUR: number }> {
    // Проверяем кэш
    const now = Date.now();
    if (this.cache.rates && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return this.cache.rates;
    }

    try {
      // Используем бесплатный API для курсов валют
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data: ExchangeRatesResponse = await response.json();
      
      // Сохраняем в кэш
      this.cache = {
        rates: data.rates,
        timestamp: now
      };

      return data.rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Возвращаем fallback курсы если API недоступно
      return {
        RUB: 90, // Примерный курс
        USD: 1,
        EUR: 0.85
      };
    }
  }

  // Конвертация из USD в RUB
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

  // Получение текущего курса USD к RUB
  async getUsdToRubRate(): Promise<number> {
    const rates = await this.getExchangeRates();
    return rates.RUB;
  }

  // Форматирование суммы в рублях
  formatRubles(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Очистка кэша (например, при смене пользователя)
  clearCache(): void {
    this.cache = {
      rates: null,
      timestamp: 0
    };
  }
}

export const currencyService = new CurrencyService();